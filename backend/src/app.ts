import Fastify from 'fastify';
import type { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import mongoose from 'mongoose';

import type { Config } from './config.js';
import healthRoute from './api/health.js';
import authRoute from './api/auth.js';
import userRoute from './api/user.js';

export async function buildApp(config: Config) {
    const isProd = config.NODE_ENV === 'production';

    console.log("... ENV: " + config.NODE_ENV)
    const app = Fastify({
        logger: { level: config.NODE_ENV === 'test' ? 'silent' : 'info' },
        trustProxy: isProd, // else clients can spoof X-Forwarded-For
    });


    // register API
    await app.register(healthRoute, { prefix: "/api" });
    await app.register(authRoute, { prefix: "/api" });
    await app.register(userRoute, { prefix: "/api" });


    // CORS is needed when the frontend is served from a different origin (e.g., Vite dev server on :5173) or when the HTML has crossorigin attributes causing same-origin asset requests to include an Origin header.
    // credentials:true is incompatible with origin:'*', so we echo known allowed origins.
    if (config.CLIENT_URLS.length > 0) {
        await app.register(cors, {
            origin: (origin, cb) =>
            !origin || config.CLIENT_URLS.includes(origin)
            ? cb(null, true)
            : cb(Object.assign(new Error('CORS'), { statusCode: 403 }), false),
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
        });
        console.log("... CLIENT_URLS: " + config.CLIENT_URLS)
    }

    // Connecting here means listen() won't resolve until the DB is reachable, and onClose drains it on shutdown.
    console.log("... MONGODB_URI: " + config.MONGODB_URI)
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 10_000,
        autoIndex: !isProd,
    });
    app.addHook('onClose', () => mongoose.connection.close());

    app.setErrorHandler((error: FastifyError, request, reply) => {
        // Mongo duplicate key -> 409 instead of an opaque 500
        if ((error as unknown as { code?: number }).code === 11000) {
            return reply.code(409).send({ error: 'Already exists' });
        }
        const status = error.statusCode ?? 500;
        if (status >= 500) request.log.error({ err: error }, 'unhandled');
        return reply.code(status).send({
            error: status >= 500 && isProd ? 'Internal Server Error' : error.message,
        });
    });


    if (config.SERVE_CLIENT) {
        console.log("... SERVE_CLIENT: " + config.SERVE_CLIENT)
        console.log("... CLIENT_DIST path: " + config.CLIENT_DIST)

        await app.register(fastifyStatic, {
            root: config.CLIENT_DIST,
            prefix: '/', // Explicitly set prefix to root
            // Bundlers hash asset filenames, so they can be cached forever. The
            // entry HTML must NOT be — otherwise users keep booting the old bundle
            // after a deploy. index:false routes '/' to the fallback below, which
            // sets no-cache, so both cases are handled in one place.
            maxAge: '1y',
            immutable: true,
            index: 'index.html', // Changed from false to 'index.html' to serve index for root
            // Leave unmatched paths to setNotFoundHandler for the SPA fallback.
            wildcard: true, // Changed from false to true to serve all files
            // Allow sending files without directory listing
            acceptRanges: true,
        });

        // Verify that files exist and are accessible
        try {
            const fs = await import('node:fs');
            const path = await import('node:path');

            // Check if index.html exists
            const indexPath = path.join(config.CLIENT_DIST, 'index.html');
            const indexExists = fs.existsSync(indexPath);
            console.log("... index.html exists: " + indexExists);

            // Check if assets directory exists
            const assetsPath = path.join(config.CLIENT_DIST, 'assets');
            const assetsExists = fs.existsSync(assetsPath);
            console.log("... assets directory exists: " + assetsExists);

            if (assetsExists) {
                const files = fs.readdirSync(assetsPath);
                console.log("... assets files: " + files.join(', '));
            }
        } catch (err) {
            console.log("... Error checking files: " + err);
        }
    }

    app.setNotFoundHandler((request, reply) => {
        // API 404s stay JSON. Only unmatched GETs become the SPA shell —
        // otherwise a typo'd POST /api/user would return HTML with a 200.
        if ( !config.SERVE_CLIENT || request.method !== 'GET' || request.url.startsWith('/api')) {
            return reply.code(404).send({ error: 'Not Found' });
        }
        // cacheControl:false stops sendFile from applying the plugin's 1y maxAge
        // to the shell, which would override the header set above.
        return reply
        .header('cache-control', 'no-cache')
        .type('text/html')
        .sendFile('index.html', { cacheControl: false });
    });

    return app;
}

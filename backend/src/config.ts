//
import 'dotenv/config';
import { resolve } from 'node:path';
import { z } from 'zod';

// z.coerce.boolean() is a trap: the string "false" coerces to TRUE.
const bool = (def: 'true' | 'false') => z.enum(['true', 'false']).default(def).transform((v) => v === 'true');

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    MONGODB_URI: z.string().min(1),

    // Comma-separated list of allowed origins for CORS.
    // Needed when the frontend is on a different origin (e.g., Vite dev server) 
    // or when HTML has crossorigin attributes that cause browser to send Origin header.
    // A same-origin production build typically needs no entries here unless crossorigin is used.
    CLIENT_URLS: z
        .string()
        .default('')
        .transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean)),

    SERVE_CLIENT: bool('false'),
    // Resolved against this file's directory, not process.cwd(), so it works
    // regardless of where the process is launched from. src/ (dev) and dist/
    // (prod) are both one level under the project root, so '../client' fits both.
    CLIENT_DIST: z.string().default('../client'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid env:', parsed.error.issues);
    process.exit(1);
}

export const config = {
    ...parsed.data,
    CLIENT_DIST: resolve(import.meta.dirname, parsed.data.CLIENT_DIST),
};

export type Config = typeof config;

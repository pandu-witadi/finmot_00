import { config } from './config.js';
import { buildApp } from './app.js';

const app = await buildApp(config);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, async () => {
        // Hard cap so a hung socket can't keep the container alive until SIGKILL
        setTimeout(() => process.exit(1), 10_000).unref();
        await app.close();
        process.exit(0);
    });
}

try {
    console.log("... HOST: " + config.HOST + "  port: " + config.PORT )
    await app.listen({
        port: config.PORT,
        host: config.HOST
    });

} catch (err) {
    app.log.error({ err }, 'failed to start');
    process.exit(1);
}

//
import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import { healthCheck } from '../controller/health.js';

const healthRoute = async (app: FastifyInstance): Promise<void> => {
    app.get(
        '/health',
        async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const result = await healthCheck();
            reply.code(200).send(result);
        }
    );
};

export default healthRoute;

import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getHeaderById,
    getAllHeaders,
    createHeader,
    updateHeader,
    deleteHeader,
    CreateHeaderRequest,
    UpdateHeaderRequest,
    GetHeadersQuery
} from '../controller/header.js';
import { verifyToken } from '../utils/jwt.js';

const headerRoute = async (app: FastifyInstance): Promise<void> => {
    const verifyAuth = async (request: FastifyRequest, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const verified = verifyToken(token);

        if (!verified) {
            return reply.code(401).send({ error: 'Invalid token' });
        }

        (request as any).user = verified;
    };

    app.get(
        '/budgetHeader',
        async (request: FastifyRequest<{ Querystring: GetHeadersQuery }>, reply: FastifyReply): Promise<void> => {
            try {
                const query: GetHeadersQuery = {
                    filter: request.query.filter ? JSON.parse(String(request.query.filter)) : undefined,
                    sort: request.query.sort ? JSON.parse(String(request.query.sort)) : undefined,
                    limit: request.query.limit ? parseInt(String(request.query.limit), 10) : undefined,
                    offset: request.query.offset ? parseInt(String(request.query.offset), 10) : undefined,
                };
                const headers = await getAllHeaders(query);
                reply.code(200).send(headers);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve headers' });
            }
        }
    );

    app.post(
        '/budgetHeader',
        async (request: FastifyRequest<{ Body: CreateHeaderRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = (request as any).user;
                const body = { ...request.body, updatedBy: user.id };
                const header = await createHeader(body);
                reply.code(201).send(header);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create header' });
            }
        }
    );

    app.get(
        '/budgetHeader/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                const header = await getHeaderById(request.params.id);
                if (!header) {
                    return reply.code(404).send({ error: 'Header not found' });
                }
                reply.code(200).send(header);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve header' });
            }
        }
    );

    app.put(
        '/budgetHeader/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateHeaderRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const header = await updateHeader(request.params.id, request.body);
                if (!header) {
                    return reply.code(404).send({ error: 'Header not found' });
                }
                reply.code(200).send(header);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update header' });
            }
        }
    );

    app.delete(
        '/budgetHeader/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteHeader(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'Header not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete header' });
            }
        }
    );
};

export default headerRoute;
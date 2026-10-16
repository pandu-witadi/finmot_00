import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getActualById,
    getAllActuals,
    createActual,
    updateActual,
    deleteActual,
    CreateActualRequest,
    UpdateActualRequest,
    GetActualsQuery
} from '../controller/actual.js';
import { verifyToken } from '../utils/jwt.js';

const actualRoute = async (app: FastifyInstance): Promise<void> => {
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
        '/actual',
        async (request: FastifyRequest<{ Querystring: GetActualsQuery }>, reply: FastifyReply): Promise<void> => {
            try {
                const query: GetActualsQuery = {
                    filter: request.query.filter ? JSON.parse(String(request.query.filter)) : undefined,
                    sort: request.query.sort ? JSON.parse(String(request.query.sort)) : undefined,
                    limit: request.query.limit ? parseInt(String(request.query.limit), 10) : undefined,
                    offset: request.query.offset ? parseInt(String(request.query.offset), 10) : undefined,
                };
                const actuals = await getAllActuals(query);
                reply.code(200).send(actuals);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve actuals' });
            }
        }
    );

    app.post(
        '/actual',
        async (request: FastifyRequest<{ Body: CreateActualRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = (request as any).user;
                const body = { ...request.body, updatedBy: user.id };
                const actual = await createActual(body);
                reply.code(201).send(actual);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create actual' });
            }
        }
    );

    app.get(
        '/actual/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                const actual = await getActualById(request.params.id);
                if (!actual) {
                    return reply.code(404).send({ error: 'Actual not found' });
                }
                reply.code(200).send(actual);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve actual' });
            }
        }
    );

    app.put(
        '/actual/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateActualRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const actual = await updateActual(request.params.id, request.body);
                if (!actual) {
                    return reply.code(404).send({ error: 'Actual not found' });
                }
                reply.code(200).send(actual);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update actual' });
            }
        }
    );

    app.delete(
        '/actual/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteActual(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'Actual not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete actual' });
            }
        }
    );
};

export default actualRoute;
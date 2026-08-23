import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getUserById,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    CreateUserRequest,
    UpdateUserRequest
} from '../controller/user.js';
import { verifyToken } from '../utils/jwt.js';

const userRoute = async (app: FastifyInstance): Promise<void> => {
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
        '/user',
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const users = await getAllUsers();
                reply.code(200).send(users);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve users' });
            }
        }
    );

    app.post(
        '/user',
        async (request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await createUser(request.body);
                reply.code(201).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create user' });
            }
        }
    );

    app.get(
        '/user/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await getUserById(request.params.id);
                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(200).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve user' });
            }
        }
    );

    app.put(
        '/user/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await updateUser(request.params.id, request.body);
                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(200).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update user' });
            }
        }
    );

    app.delete(
        '/user/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteUser(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete user' });
            }
        }
    );
};

export default userRoute;
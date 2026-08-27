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
    updateUserMainInfo,
    updateUserBankInfo,
    updateUserDeposit,
    CreateUserRequest,
    UpdateUserRequest,
    UpdateUserMainInfoRequest,
    UpdateUserBankInfoRequest,
    UpdateUserDepositRequest
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

    // Update main info (email, password, name, role)
    app.put(
        '/user/:id/info',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserMainInfoRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await updateUserMainInfo(request.params.id, request.body);
                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(200).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update user main info' });
            }
        }
    );

    // Update bank information
    app.put(
        '/user/:id/bank',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserBankInfoRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await updateUserBankInfo(request.params.id, request.body);
                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(200).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update user bank info' });
            }
        }
    );

    // Update deposit information
    app.put(
        '/user/:id/deposit',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserDepositRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = await updateUserDeposit(request.params.id, request.body);
                if (!user) {
                    return reply.code(404).send({ error: 'User not found' });
                }
                reply.code(200).send(user);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update user deposit info' });
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
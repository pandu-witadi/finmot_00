import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getTransactionById,
    getAllTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    CreateTransactionRequest,
    UpdateTransactionRequest,
    GetTransactionsQuery
} from '../controller/transaction.js';
import { verifyToken } from '../utils/jwt.js';

const transactionRoute = async (app: FastifyInstance): Promise<void> => {
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
        '/transaction',
        async (request: FastifyRequest<{ Querystring: GetTransactionsQuery }>, reply: FastifyReply): Promise<void> => {
            try {
                const query: GetTransactionsQuery = {
                    filter: request.query.filter ? JSON.parse(String(request.query.filter)) : undefined,
                    sort: request.query.sort ? JSON.parse(String(request.query.sort)) : undefined,
                    limit: request.query.limit ? parseInt(String(request.query.limit), 10) : undefined,
                    offset: request.query.offset ? parseInt(String(request.query.offset), 10) : undefined,
                };
                const transactions = await getAllTransactions(query);
                reply.code(200).send(transactions);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve transactions' });
            }
        }
    );

    app.post(
        '/transaction',
        async (request: FastifyRequest<{ Body: CreateTransactionRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = (request as any).user;
                const body = { ...request.body, updatedBy: user.id };
                const transaction = await createTransaction(body);
                reply.code(201).send(transaction);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create transaction' });
            }
        }
    );

    app.get(
        '/transaction/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                const transaction = await getTransactionById(request.params.id);
                if (!transaction) {
                    return reply.code(404).send({ error: 'Transaction not found' });
                }
                reply.code(200).send(transaction);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve transaction' });
            }
        }
    );

    app.put(
        '/transaction/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateTransactionRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const transaction = await updateTransaction(request.params.id, request.body);
                if (!transaction) {
                    return reply.code(404).send({ error: 'Transaction not found' });
                }
                reply.code(200).send(transaction);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update transaction' });
            }
        }
    );

    app.delete(
        '/transaction/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteTransaction(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'Transaction not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete transaction' });
            }
        }
    );
};

export default transactionRoute;
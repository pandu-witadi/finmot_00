import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getBudgetById,
    getAllBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    CreateBudgetRequest,
    UpdateBudgetRequest,
    GetBudgetsQuery
} from '../controller/budget.js';
import { verifyToken } from '../utils/jwt.js';

const budgetRoute = async (app: FastifyInstance): Promise<void> => {
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
        '/budget',
        async (request: FastifyRequest<{ Querystring: GetBudgetsQuery }>, reply: FastifyReply): Promise<void> => {
            try {
                const query: GetBudgetsQuery = {
                    filter: request.query.filter ? JSON.parse(String(request.query.filter)) : undefined,
                    sort: request.query.sort ? JSON.parse(String(request.query.sort)) : undefined,
                    limit: request.query.limit ? parseInt(String(request.query.limit), 10) : undefined,
                    offset: request.query.offset ? parseInt(String(request.query.offset), 10) : undefined,
                };
                const budgets = await getAllBudgets(query);
                reply.code(200).send(budgets);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve budgets' });
            }
        }
    );

    app.post(
        '/budget',
        async (request: FastifyRequest<{ Body: CreateBudgetRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const user = (request as any).user;
                const body = { ...request.body, updatedBy: user.id };
                const budget = await createBudget(body);
                reply.code(201).send(budget);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create budget' });
            }
        }
    );

    app.get(
        '/budget/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                const budget = await getBudgetById(request.params.id);
                if (!budget) {
                    return reply.code(404).send({ error: 'Budget not found' });
                }
                reply.code(200).send(budget);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve budget' });
            }
        }
    );

    app.put(
        '/budget/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateBudgetRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const budget = await updateBudget(request.params.id, request.body);
                if (!budget) {
                    return reply.code(404).send({ error: 'Budget not found' });
                }
                reply.code(200).send(budget);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update budget' });
            }
        }
    );

    app.delete(
        '/budget/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteBudget(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'Budget not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete budget' });
            }
        }
    );
};

export default budgetRoute;
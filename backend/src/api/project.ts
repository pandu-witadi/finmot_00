import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    getProjectById,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    CreateProjectRequest,
    UpdateProjectRequest
} from '../controller/project.js';
import { verifyToken } from '../utils/jwt.js';

const projectRoute = async (app: FastifyInstance): Promise<void> => {
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
        '/project',
        async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                const projects = await getAllProjects();
                reply.code(200).send(projects);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve projects' });
            }
        }
    );

    app.post(
        '/project',
        async (request: FastifyRequest<{ Body: CreateProjectRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const project = await createProject(request.body);
                reply.code(201).send(project);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to create project' });
            }
        }
    );

    app.get(
        '/project/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                const project = await getProjectById(request.params.id);
                if (!project) {
                    return reply.code(404).send({ error: 'Project not found' });
                }
                reply.code(200).send(project);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to retrieve project' });
            }
        }
    );

    app.put(
        '/project/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateProjectRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const project = await updateProject(request.params.id, request.body);
                if (!project) {
                    return reply.code(404).send({ error: 'Project not found' });
                }
                reply.code(200).send(project);
            } catch (error) {
                reply.code(500).send({ error: 'Failed to update project' });
            }
        }
    );

    app.delete(
        '/project/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
            try {
                await verifyAuth(request, reply);
                const deleted = await deleteProject(request.params.id);
                if (!deleted) {
                    return reply.code(404).send({ error: 'Project not found' });
                }
                reply.code(204).send();
            } catch (error) {
                reply.code(500).send({ error: 'Failed to delete project' });
            }
        }
    );
};

export default projectRoute;
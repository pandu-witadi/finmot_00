import {
    FastifyInstance,
    FastifyRequest,
    FastifyReply
} from 'fastify';
import {
    register,
    login,
    LoginRequest,
    RegisterRequest,
    AuthResponse
} from '../controller/auth.js';
import { verifyToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/security.js';
import { User } from '../model/user.js';

const authRoute = async (app: FastifyInstance): Promise<void> => {
    app.post(
        '/auth/register',
        async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply): Promise<void> => {
            const result = await register(request.body);
            reply.code(201).send(result);
        }
    );

    app.post(
        '/auth/login',
        async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply): Promise<void> => {
            try {
                const result = await login(request.body);
                reply.code(200).send(result);
            } catch (error) {
                reply.code(401).send({ error: 'Invalid credentials' });
            }
        }
    );

    app.get(
        '/auth/isAuthenticated',
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const authHeader = request.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                reply.code(401).send({ isAuthenticated: false });
                return;
            }

            const token = authHeader.substring(7);
            const verified = verifyToken(token);

            if (!verified) {
                reply.code(401).send({ isAuthenticated: false });
                return;
            }

            const user = await User.findById(verified.id).select('email role name');
            
            if (!user) {
                reply.code(401).send({ isAuthenticated: false });
                return;
            }

            reply.code(200).send({
                isAuthenticated: true,
                user: {
                    id: verified.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                }
            });
        }
    );
};

export default authRoute;

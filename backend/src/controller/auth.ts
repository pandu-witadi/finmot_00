import { User } from '../model/user.js';
import { hashPassword, comparePassword } from '../utils/security.js';
import { signToken, JwtPayload } from '../utils/jwt.js';

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name?: string;
        role: string;
    };
    accessToken: string;
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
    const hashedPassword = await hashPassword(body.password);
    
    const user = new User({
        email: body.email,
        password: hashedPassword,
        name: body.name || '',
        role: 'user',
    });
    await user.save();

    const payload: JwtPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    };
    const accessToken = signToken(payload);

    return {
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
        },
        accessToken,
    };
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
    const user = await User.findOne({ email: body.email }).select('+password');
    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.password) {
        throw new Error('Invalid credentials');
    }

    const isValid = await comparePassword(body.password, user.password);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    const payload: JwtPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    };
    const accessToken = signToken(payload);

    return {
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
        },
        accessToken,
    };
}
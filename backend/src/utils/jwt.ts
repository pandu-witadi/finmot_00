import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export function signToken(payload: JwtPayload, expiresIn: StringValue | number = '2d'): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', options);
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}
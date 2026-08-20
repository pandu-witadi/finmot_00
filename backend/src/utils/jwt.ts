import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export function signToken(payload: JwtPayload, expiresIn: string = '15m'): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}
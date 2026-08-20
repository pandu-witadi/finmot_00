//
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserDoc } from '../model/user.js';

export interface HealthStatus {
    status_db: 'db connected' | 'db error';
    server_time: string;
    random: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
}

export function createTokens(user: UserDoc): AuthTokens {
    const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
    );
    return { accessToken };
}

export interface VerifiedToken {
    id: string;
    email: string;
    role: string;
}

export function verifyToken(token: string): VerifiedToken | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return decoded as VerifiedToken;
    } catch (error) {
        return null;
    }
}

function formatLocalTime(date: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

export async function healthCheck(): Promise<HealthStatus> {
    const status_db = mongoose.connection.readyState === 1;
    const random = Math.random().toString(36).substring(2, 10);
    return {
        status_db: status_db ? 'db connected' : 'db error',
        server_time: formatLocalTime(new Date()),
        random,
    };
}

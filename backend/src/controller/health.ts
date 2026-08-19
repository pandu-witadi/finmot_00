//
import mongoose from 'mongoose';

export interface HealthStatus {
    status_db: 'db connected' | 'db error';
    server_time: string;
    random: string;
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

import { User } from '../model/user.js';
import { hashPassword } from '../utils/security.js';

export interface GetUserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    bankInfo?: Array<{
        bank: string;
        code: string;
        accountNo: string;
        name: string;
    }>;
    createdAt: Date;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    name?: string;
    role?: string;
    bankInfo?: Array<{
        bank: string;
        code: string;
        accountNo: string;
        name: string;
    }>;
}

export interface UpdateUserRequest {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    bankInfo?: Array<{
        bank: string;
        code: string;
        accountNo: string;
        name: string;
    }>;
}

function userToResponse(user: any): GetUserResponse {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        bankInfo: user.bankInfo,
        createdAt: user.createdAt,
    };
}

export async function getUserById(id: string): Promise<GetUserResponse | null> {
    const user = await User.findById(id);
    if (!user) {
        return null;
    }
    return userToResponse(user);
}

export async function getAllUsers(): Promise<GetUserResponse[]> {
    const users = await User.find();
    return users.map(userToResponse);
}

export async function createUser(body: CreateUserRequest): Promise<GetUserResponse> {
    const hashedPassword = body.password ? await hashPassword(body.password) : undefined;
    
    const user = new User({
        email: body.email,
        password: hashedPassword,
        name: body.name || '',
        role: body.role || 'user',
        bankInfo: body.bankInfo,
    });
    await user.save();

    return userToResponse(user);
}

export async function updateUser(id: string, body: UpdateUserRequest): Promise<GetUserResponse | null> {
    const updateFields: any = { ...body };
    
    if (body.password) {
        updateFields.password = await hashPassword(body.password);
    }
    
    if (body.bankInfo !== undefined) {
        updateFields.bankInfo = body.bankInfo;
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    ).select('+password');

    if (!user) {
        return null;
    }

    return userToResponse(user);
}

export async function deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
}
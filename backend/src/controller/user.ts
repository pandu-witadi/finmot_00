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
    const hashedPassword = body.password && body.password.trim() !== '' 
        ? await hashPassword(body.password.trim()) 
        : undefined;
    
    const user = new User({
        email: body.email,
        password: hashedPassword,
        name: body.name?.trim() || '',
        role: body.role || 'user',
        bankInfo: body.bankInfo,
    });
    await user.save();

    return userToResponse(user);
}

export async function updateUser(id: string, body: UpdateUserRequest): Promise<GetUserResponse | null> {
    const updateFields: any = {};
    
    // Only include fields that have meaningful values
    if (body.email !== undefined && body.email !== "") {
        updateFields.email = body.email;
    }
    
    // Only hash and update password if it's provided and non-empty
    if (body.password && body.password !== "") {
        updateFields.password = await hashPassword(body.password);
    }
    
    if (body.name !== undefined && body.name !== "") {
        updateFields.name = body.name;
    }
    
    if (body.role !== undefined) {
        updateFields.role = body.role;
    }
    
    if (body.bankInfo !== undefined) {
        // If empty array, explicitly set to clear bankInfo
        // If non-empty array, set the new bankInfo
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
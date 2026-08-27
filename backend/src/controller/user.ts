import { User } from '../model/user.js';
import { hashPassword } from '../utils/security.js';
import { calculateDepositTotal } from '../utils/deposit.js';

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
    deposit?: {
        total?: number;
        detail?: Array<{
            sign?: "+" | "-";
            amount?: number;
            note?: string;
            date?: Date;
        }>;
    };
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
    deposit?: {
        total?: number;
        detail?: Array<{
            sign?: "+" | "-";
            amount?: number;
            note?: string;
            date?: Date;
        }>;
    };
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
    deposit?: {
        total?: number;
        detail?: Array<{
            sign?: "+" | "-";
            amount?: number;
            note?: string;
            date?: Date;
        }>;
    };
}

function userToResponse(user: any): GetUserResponse {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        bankInfo: user.bankInfo,
        deposit: user.deposit,
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
    
    const depositTotal = calculateDepositTotal(body.deposit?.detail ?? []);
    
    const user = new User({
        email: body.email,
        password: hashedPassword,
        name: body.name?.trim() || '',
        role: body.role || 'user',
        bankInfo: body.bankInfo,
        deposit: {
            total: depositTotal,
            detail: body.deposit?.detail,
        },
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
    if (body.password && body.password.trim() !== "") {
        updateFields.password = await hashPassword(body.password.trim());
    }
    
    if (body.name !== undefined && body.name !== "") {
        updateFields.name = body.name;
    }
    
    if (body.role !== undefined) {
        updateFields.role = body.role;
    }
    
    if (body.bankInfo !== undefined) {
        updateFields.bankInfo = body.bankInfo;
    }
    
    if (body.deposit !== undefined) {
        // Calculate total from deposit entries if detail is provided
        if (body.deposit.detail !== undefined) {
            updateFields.deposit = {
                total: calculateDepositTotal(body.deposit.detail),
                detail: body.deposit.detail,
            };
        } else {
            updateFields.deposit = body.deposit;
        }
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

// Separate update functions for each data type

export interface UpdateUserMainInfoRequest {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
}

export async function updateUserMainInfo(
    id: string, 
    body: UpdateUserMainInfoRequest
): Promise<GetUserResponse | null> {
    const updateFields: any = {};
    
    if (body.email !== undefined && body.email !== "") {
        updateFields.email = body.email;
    }
    
    if (body.password && body.password.trim() !== "") {
        updateFields.password = await hashPassword(body.password.trim());
    }
    
    if (body.name !== undefined && body.name !== "") {
        updateFields.name = body.name;
    }
    
    if (body.role !== undefined) {
        updateFields.role = body.role;
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

export interface UpdateUserBankInfoRequest {
    bankInfo: Array<{
        bank: string;
        code: string;
        accountNo: string;
        name: string;
    }>;
}

export async function updateUserBankInfo(
    id: string, 
    body: UpdateUserBankInfoRequest
): Promise<GetUserResponse | null> {
    if (body.bankInfo === undefined) {
        return null;
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { bankInfo: body.bankInfo } },
        { new: true }
    ).select('+password');

    if (!user) {
        return null;
    }

    return userToResponse(user);
}

export interface UpdateUserDepositRequest {
    detail?: Array<{
        sign?: "+" | "-";
        amount?: number;
        note?: string;
        date?: Date;
    }>;
}

export async function updateUserDeposit(
    id: string, 
    body: UpdateUserDepositRequest
): Promise<GetUserResponse | null> {
    const updateFields: any = {};
    
    if (body.detail !== undefined) {
        updateFields.deposit = {
            total: calculateDepositTotal(body.detail),
            detail: body.detail,
        };
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
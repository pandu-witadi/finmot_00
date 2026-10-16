import { Transaction } from '../model/transaction.js';
import mongoose from 'mongoose';

export interface TransactionResponse {
    id: string;
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    arrActual: string[];
    updatedBy: string;
    createdAt: Date;
}

export interface CreateTransactionRequest {
    name: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    arrActual?: string[];
    updatedBy?: string;
}

export interface UpdateTransactionRequest {
    name?: string;
    tags?: string[];
    active?: boolean;
    type?: 'income' | 'expense';
    amount?: number;
    project?: string;
    arrActual?: string[];
    updatedBy?: string;
}

export interface TransactionFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    tags?: string[];
    search?: string;
}

export interface TransactionSort {
    field?: 'name' | 'amount' | 'createdAt';
    order?: 'asc' | 'desc';
}

export interface GetTransactionsQuery {
    filter?: TransactionFilter;
    sort?: TransactionSort;
    limit?: number;
    offset?: number;
}

function transactionToResponse(transaction: any): TransactionResponse {
    return {
        id: transaction._id.toString(),
        name: transaction.name,
        tags: transaction.tags,
        active: transaction.active,
        type: transaction.type,
        amount: transaction.amount,
        project: transaction.project.toString(),
        arrActual: transaction.arrActual.map((id: any) => id.toString()),
        updatedBy: transaction.updatedBy.toString(),
        createdAt: transaction.createdAt,
    };
}

export async function getTransactionById(id: string): Promise<TransactionResponse | null> {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
        return null;
    }
    return transactionToResponse(transaction);
}

export async function getAllTransactions(query?: GetTransactionsQuery): Promise<TransactionResponse[]> {
    const { filter, sort, limit, offset } = query || {};

    const mongoQuery: any = {};

    if (filter) {
        if (filter.project !== undefined) {
            mongoQuery.project = new mongoose.Types.ObjectId(filter.project);
        }

        if (filter.active !== undefined) {
            mongoQuery.active = filter.active;
        }

        if (filter.type !== undefined) {
            mongoQuery.type = filter.type;
        }

        if (filter.tags && filter.tags.length > 0) {
            mongoQuery.tags = { $in: filter.tags };
        }

        if (filter.search) {
            const searchRegex = new RegExp(filter.search, 'i');
            mongoQuery.$or = [
                { name: searchRegex },
            ];
        }
    }

    const sortField = sort?.field || 'createdAt';
    const sortOrder = sort?.order === 'asc' ? 1 : -1;

    const transactionsQuery = Transaction.find(mongoQuery)
        .sort({ [sortField]: sortOrder });

    if (offset !== undefined && offset > 0) {
        transactionsQuery.skip(offset);
    }

    if (limit !== undefined && limit > 0) {
        transactionsQuery.limit(limit);
    }

    const transactions = await transactionsQuery;
    return transactions.map(transactionToResponse);
}

export async function createTransaction(body: CreateTransactionRequest): Promise<TransactionResponse> {
    const transaction = new Transaction({
        name: body.name.trim(),
        tags: body.tags ?? [],
        active: body.active ?? true,
        type: body.type,
        amount: body.amount,
        project: new mongoose.Types.ObjectId(body.project),
        arrActual: (body.arrActual ?? []).map((id: any) => new mongoose.Types.ObjectId(id)),
        updatedBy: new mongoose.Types.ObjectId(body.updatedBy || "000000000000000000000000"),
    });
    await transaction.save();
    return transactionToResponse(transaction);
}

export async function updateTransaction(id: string, body: UpdateTransactionRequest): Promise<TransactionResponse | null> {
    const updateFields: any = {};

    if (body.name !== undefined) {
        updateFields.name = body.name.trim();
    }

    if (body.tags !== undefined) {
        updateFields.tags = body.tags;
    }

    if (body.active !== undefined) {
        updateFields.active = body.active;
    }

    if (body.type !== undefined) {
        updateFields.type = body.type;
    }

    if (body.amount !== undefined) {
        updateFields.amount = body.amount;
    }

    if (body.project !== undefined) {
        updateFields.project = new mongoose.Types.ObjectId(body.project);
    }

    if (body.arrActual !== undefined) {
        updateFields.arrActual = body.arrActual.map((id: any) => new mongoose.Types.ObjectId(id));
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = new mongoose.Types.ObjectId(body.updatedBy);
    }

    const transaction = await Transaction.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!transaction) {
        return null;
    }

    return transactionToResponse(transaction);
}

export async function deleteTransaction(id: string): Promise<boolean> {
    const result = await Transaction.findByIdAndDelete(id);
    return result !== null;
}
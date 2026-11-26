import { Transaction } from '../model/transaction.js';
import { Actual } from '../model/actual.js';
import { Project } from '../model/project.js';
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
    exDate: Date;
    assignedTo: string | null;
    position: number;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    done: boolean;
}

export interface CreateTransactionRequest {
    name: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    arrActual?: string[];
    exDate: Date;
    assignedTo?: string;
    position?: number;
    updatedBy?: string;
}

export interface UpdateTransactionRequest {
    name?: string;
    tags?: string[];
    note?: string;
    type?: 'income' | 'expense';
    amount?: number;
    project?: string;
    arrActual?: string[];
    exDate?: Date;
    assignedTo?: string;
    position?: number;
    updatedBy?: string;
    done?: boolean;
}

export interface TransactionFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    tags?: string[];
    search?: string;
}

export interface TransactionSort {
    field?: 'name' | 'amount' | 'createdAt' | 'position';
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
        exDate: transaction.exDate,
        assignedTo: transaction.assignedTo ? transaction.assignedTo.toString() : null,
        position: transaction.position ?? 0,
        updatedBy: transaction.updatedBy.toString(),
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt || transaction.createdAt,
        done: transaction.done ?? false,
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

    const sortField = sort?.field ?? 'position';
    const sortOrder = sort?.order === 'asc' ? 1 : -1;

    const transactionsQuery = Transaction.find(mongoQuery)
        .sort({ [sortField]: sortOrder, createdAt: 1 });

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
        exDate: body.exDate,
        assignedTo: body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : null,
        position: body.position ?? 0,
        updatedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(body.updatedBy || "000000000000000000000000"),
    });
    await transaction.save();
    return transactionToResponse(transaction);
}

export async function updateTransaction(id: string, body: UpdateTransactionRequest): Promise<TransactionResponse | null> {
    const updateFields: any = {
        updatedAt: new Date()
    };

    if (body.name !== undefined) {
        updateFields.name = body.name.trim();
    }

    if (body.tags !== undefined) {
        updateFields.tags = body.tags;
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

    if (body.exDate !== undefined) {
        updateFields.exDate = body.exDate;
    }

    if (body.assignedTo !== undefined) {
        updateFields.assignedTo = new mongoose.Types.ObjectId(body.assignedTo);
    }

    if (body.position !== undefined) {
        updateFields.position = body.position;
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = new mongoose.Types.ObjectId(body.updatedBy);
    }

    if (body.done !== undefined) {
        updateFields.done = body.done;
    }

    // Check if done field is being updated
    const isDoneUpdated = body.done !== undefined;
    const newDoneValue = body.done;

    const transaction = await Transaction.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!transaction) {
        return null;
    }

    // If done field was updated, propagate to connected actuals
    if (isDoneUpdated && transaction.arrActual && transaction.arrActual.length > 0) {
        await Actual.updateMany(
            { _id: { $in: transaction.arrActual } },
            { $set: { done: newDoneValue } }
        );
    }

    return transactionToResponse(transaction);
}

export async function deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
        return { success: false, error: 'Transaction not found' };
    }

    // Step 1: Set transaction field to null and done to false on all actuals referencing this transaction
    await Actual.updateMany(
        { transaction: transaction._id },
        { $set: { transaction: null, done: false } }
    );

    // Step 2: Remove transaction ID from project's arrTransaction
    await Project.findByIdAndUpdate(transaction.project, {
        $pull: { arrTransaction: transaction._id }
    });

    // Step 3: Delete the transaction
    const result = await Transaction.findByIdAndDelete(id);
    return { success: result !== null };
}
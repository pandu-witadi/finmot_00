import { Actual } from '../model/actual.js';
import { Budget } from '../model/budget.js';
import { Project } from '../model/project.js';
import { Transaction } from '../model/transaction.js';
import mongoose from 'mongoose';

export interface ActualResponse {
    id: string;
    name: string;
    note?: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    budget: string;
    transaction: string | null;
    exDate: Date;
    assignedTo: string;
    updatedAt: Date;
    updatedBy: string;
    createdAt: Date;
    done: boolean;
}

export interface CreateActualRequest {
    name: string;
    note?: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    budget: string;
    transaction?: string;
    exDate: Date;
    updatedBy?: string;
}

export interface UpdateActualRequest {
    name?: string;
    note?: string;
    tags?: string[];
    active?: boolean;
    type?: 'income' | 'expense';
    amount?: number;
    project?: string;
    budget?: string;
    transaction?: string;
    exDate?: Date;
    assignedTo?: string;
    updatedBy?: string;
}

export interface ActualFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    budget?: string;
    tags?: string[];
    search?: string;
}

export interface ActualSort {
    field?: 'name' | 'amount' | 'createdAt';
    order?: 'asc' | 'desc';
}

export interface GetActualsQuery {
    filter?: ActualFilter;
    sort?: ActualSort;
    limit?: number;
    offset?: number;
}

function actualToResponse(actual: any): ActualResponse {
    return {
        id: actual._id.toString(),
        name: actual.name,
        note: actual.note,
        tags: actual.tags,
        active: actual.active,
        type: actual.type,
        amount: actual.amount,
        project: actual.project.toString(),
        budget: actual.budget.toString(),
        transaction: actual.transaction ? actual.transaction.toString() : null,
        exDate: actual.exDate,
        assignedTo: actual.assignedTo ? actual.assignedTo.toString() : "000000000000000000000000",
        updatedAt: actual.updatedAt,
        updatedBy: actual.updatedBy.toString(),
        createdAt: actual.createdAt,
        done: actual.done ?? false,
    };
}

export async function getActualById(id: string): Promise<ActualResponse | null> {
    const actual = await Actual.findById(id);
    if (!actual) {
        return null;
    }
    return actualToResponse(actual);
}

export async function getAllActuals(query?: GetActualsQuery): Promise<ActualResponse[]> {
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

        if (filter.budget !== undefined) {
            mongoQuery.budget = new mongoose.Types.ObjectId(filter.budget);
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

    const actualsQuery = Actual.find(mongoQuery)
        .sort({ [sortField]: sortOrder });

    if (offset !== undefined && offset > 0) {
        actualsQuery.skip(offset);
    }

    if (limit !== undefined && limit > 0) {
        actualsQuery.limit(limit);
    }

    const actuals = await actualsQuery;
    return actuals.map(actualToResponse);
}

export async function createActual(body: CreateActualRequest): Promise<ActualResponse> {
    const transaction = body.transaction && body.transaction !== '' 
        ? new mongoose.Types.ObjectId(body.transaction)
        : null;
    const actual = new Actual({
        name: body.name.trim(),
        note: body.note,
        tags: body.tags ?? [],
        active: body.active ?? true,
        type: body.type,
        amount: body.amount,
        project: new mongoose.Types.ObjectId(body.project),
        budget: new mongoose.Types.ObjectId(body.budget),
        transaction: transaction,
        assignedTo: null,
        exDate: body.exDate,
        updatedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(body.updatedBy || "000000000000000000000000"),
    });
    await actual.save();

    // Add actual ID to project's arrActual
    await Project.findByIdAndUpdate(body.project, {
        $push: { arrActual: actual._id }
    });

    return actualToResponse(actual);
}

export async function updateActual(id: string, body: UpdateActualRequest): Promise<ActualResponse | null> {
    const updateFields: any = {
        updatedAt: new Date()
    };

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

    if (body.budget !== undefined) {
        updateFields.budget = new mongoose.Types.ObjectId(body.budget);
    }

    if (body.transaction !== undefined && body.transaction !== '') {
        updateFields.transaction = new mongoose.Types.ObjectId(body.transaction);
    }

    if (body.exDate !== undefined) {
        updateFields.exDate = body.exDate;
    }

    if (body.assignedTo !== undefined) {
        updateFields.assignedTo = new mongoose.Types.ObjectId(body.assignedTo);
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = new mongoose.Types.ObjectId(body.updatedBy);
    }

    if (body.note !== undefined) {
        updateFields.note = body.note;
    }

    const actual = await Actual.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!actual) {
        return null;
    }

    return actualToResponse(actual);
}

export interface CloneToTransactionRequest {
    actualId: string;
    transactionName: string;
    updatedBy: string;
}

export async function cloneToTransaction(body: CloneToTransactionRequest): Promise<{actual: ActualResponse, transaction: any}> {
    const actual = await Actual.findById(body.actualId);
    if (!actual) {
        throw new Error('Actual not found');
    }

    // Create a new transaction
    const transaction = new Transaction({
        name: body.transactionName.trim() || actual.name,
        tags: [...actual.tags],
        type: actual.type,
        amount: actual.amount,
        project: actual.project,
        exDate: actual.exDate || new Date(),
        assignedTo: actual.assignedTo || undefined,
        updatedBy: body.updatedBy as any,
    });
    await transaction.save();

    // Add transaction ID to project's arrTransaction
    await Project.findByIdAndUpdate(actual.project, {
        $push: { arrTransaction: transaction._id }
    });

    // Update actual's transaction field to point to the new transaction
    actual.transaction = transaction._id as any;
    await actual.save();

    // Add actual ID to transaction's arrActual
    await Transaction.findByIdAndUpdate(transaction._id as any, {
        $push: { arrActual: actual._id as any }
    });

    return {
        actual: actualToResponse(actual),
        transaction: {
            id: transaction._id.toString(),
            name: transaction.name,
            tags: transaction.tags,
            type: transaction.type,
            amount: transaction.amount,
            project: transaction.project.toString(),
            arrActual: [actual._id.toString()],
            exDate: transaction.exDate,
            assignedTo: transaction.assignedTo ? transaction.assignedTo.toString() : null,
            updatedBy: transaction.updatedBy.toString(),
            createdAt: transaction.createdAt,
        },
    };
}

export async function deleteActual(id: string): Promise<{ success: boolean; error?: string }> {
    const actual = await Actual.findById(id);
    if (!actual) {
        return { success: false, error: 'Actual not found' };
    }

    // Check if actual has a transaction connected
    const hasTransaction = actual.transaction !== null && 
                           actual.transaction !== undefined &&
                           actual.transaction.toString() !== '000000000000000000000000';
    if (hasTransaction) {
        return { success: false, error: 'Cannot delete actual: a transaction is connected to it' };
    }

    // Remove actual ID from budget's arrActual
    if (actual.budget) {
        await Budget.findByIdAndUpdate(actual.budget, {
            $pull: { arrActual: id }
        });
    }

    // Remove actual ID from project's arrActual
    if (actual.project) {
        await Project.findByIdAndUpdate(actual.project, {
            $pull: { arrActual: id }
        });
    }

    const result = await Actual.findByIdAndDelete(id);
    return { success: result !== null };
}
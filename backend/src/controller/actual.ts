import { Actual } from '../model/actual.js';
import { Budget } from '../model/budget.js';
import { Project } from '../model/project.js';
import mongoose from 'mongoose';

export interface ActualResponse {
    id: string;
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    budget: string;
    trx: string;
    assignedTo: string;
    updatedBy: string;
    createdAt: Date;
}

export interface CreateActualRequest {
    name: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    budget: string;
    trx: string;
    updatedBy?: string;
}

export interface UpdateActualRequest {
    name?: string;
    tags?: string[];
    active?: boolean;
    type?: 'income' | 'expense';
    amount?: number;
    project?: string;
    budget?: string;
    trx?: string;
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
        tags: actual.tags,
        active: actual.active,
        type: actual.type,
        amount: actual.amount,
        project: actual.project.toString(),
        budget: actual.budget.toString(),
        trx: actual.trx.toString(),
        assignedTo: actual.assignedTo ? actual.assignedTo.toString() : "000000000000000000000000",
        updatedBy: actual.updatedBy.toString(),
        createdAt: actual.createdAt,
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
    const actual = new Actual({
        name: body.name.trim(),
        tags: body.tags ?? [],
        active: body.active ?? true,
        type: body.type,
        amount: body.amount,
        project: new mongoose.Types.ObjectId(body.project),
        budget: new mongoose.Types.ObjectId(body.budget),
        trx: new mongoose.Types.ObjectId(body.trx),
        updatedBy: new mongoose.Types.ObjectId(body.updatedBy || "000000000000000000000000"),
    });
    await actual.save();
    return actualToResponse(actual);
}

export async function updateActual(id: string, body: UpdateActualRequest): Promise<ActualResponse | null> {
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

    if (body.budget !== undefined) {
        updateFields.budget = new mongoose.Types.ObjectId(body.budget);
    }

    if (body.trx !== undefined) {
        updateFields.trx = new mongoose.Types.ObjectId(body.trx);
    }

    if (body.assignedTo !== undefined) {
        updateFields.assignedTo = new mongoose.Types.ObjectId(body.assignedTo);
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = new mongoose.Types.ObjectId(body.updatedBy);
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

export async function deleteActual(id: string): Promise<boolean> {
    const actual = await Actual.findById(id);
    if (!actual) {
        return false;
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
    return result !== null;
}
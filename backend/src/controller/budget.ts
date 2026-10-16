import { Budget } from '../model/budget.js';
import { Header } from '../model/header.js';
import { Project } from '../model/project.js';
import mongoose from 'mongoose';

export interface BudgetResponse {
    id: string;
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    header: string;
    arrActual: string[];
    arrTransaction: string[];
    updatedBy: string;
    createdAt: Date;
}

export interface CreateBudgetRequest {
    name: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    header?: string;
    arrActual?: string[];
    arrTransaction?: string[];
    updatedBy?: string;
}

export interface UpdateBudgetRequest {
    name?: string;
    tags?: string[];
    active?: boolean;
    type?: 'income' | 'expense';
    amount?: number;
    project?: string;
    header?: string;
    arrActual?: string[];
    arrTransaction?: string[];
    updatedBy?: string;
}

export interface BudgetFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    tags?: string[];
    search?: string;
}

export interface BudgetSort {
    field?: 'name' | 'amount' | 'createdAt';
    order?: 'asc' | 'desc';
}

export interface GetBudgetsQuery {
    filter?: BudgetFilter;
    sort?: BudgetSort;
    limit?: number;
    offset?: number;
}

function budgetToResponse(budget: any): BudgetResponse {
    return {
        id: budget._id.toString(),
        name: budget.name,
        tags: budget.tags,
        active: budget.active,
        type: budget.type,
        amount: budget.amount,
        project: budget.project.toString(),
        header: budget.header.toString(),
        arrActual: budget.arrActual.map((id: any) => id.toString()),
        arrTransaction: budget.arrTransaction.map((id: any) => id.toString()),
        updatedBy: budget.updatedBy.toString(),
        createdAt: budget.createdAt,
    };
}

export async function getBudgetById(id: string): Promise<BudgetResponse | null> {
    const budget = await Budget.findById(id);
    if (!budget) {
        return null;
    }
    return budgetToResponse(budget);
}

export async function getAllBudgets(query?: GetBudgetsQuery): Promise<BudgetResponse[]> {
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

    const budgetsQuery = Budget.find(mongoQuery)
        .sort({ [sortField]: sortOrder });

    if (offset !== undefined && offset > 0) {
        budgetsQuery.skip(offset);
    }

    if (limit !== undefined && limit > 0) {
        budgetsQuery.limit(limit);
    }

    const budgets = await budgetsQuery;
    return budgets.map(budgetToResponse);
}

export async function createBudget(body: CreateBudgetRequest): Promise<BudgetResponse> {
    const headerId = new mongoose.Types.ObjectId(body.header);
    
    const budget = new Budget({
        name: body.name.trim(),
        tags: body.tags ?? [],
        active: body.active ?? true,
        type: body.type,
        amount: body.amount,
        project: new mongoose.Types.ObjectId(body.project),
        header: headerId,
        arrActual: (body.arrActual ?? []).map((id: any) => new mongoose.Types.ObjectId(id)),
        arrTransaction: (body.arrTransaction ?? []).map((id: any) => new mongoose.Types.ObjectId(id)),
        updatedBy: new mongoose.Types.ObjectId(body.updatedBy || "000000000000000000000000"),
    });
    await budget.save();
    
    // Add budget ID to project's arrBudget
    await Project.findByIdAndUpdate(body.project, {
        $push: { arrBudget: budget._id }
    });
    
    // Add budget ID to header's arrBudget
    await Header.findByIdAndUpdate(headerId, {
        $push: { arrBudget: budget._id }
    });
    
    return budgetToResponse(budget);
}

export async function updateBudget(id: string, body: UpdateBudgetRequest): Promise<BudgetResponse | null> {
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

    if (body.header !== undefined) {
        updateFields.header = new mongoose.Types.ObjectId(body.header);
    }

    if (body.arrActual !== undefined) {
        updateFields.arrActual = body.arrActual.map((id: any) => new mongoose.Types.ObjectId(id));
    }

    if (body.arrTransaction !== undefined) {
        updateFields.arrTransaction = body.arrTransaction.map((id: any) => new mongoose.Types.ObjectId(id));
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = new mongoose.Types.ObjectId(body.updatedBy);
    }

    const budget = await Budget.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!budget) {
        return null;
    }

    return budgetToResponse(budget);
}

export async function deleteBudget(id: string): Promise<boolean> {
    // Find the budget first to get its references
    const budget = await Budget.findById(id);
    if (!budget) {
        return false;
    }

    // Remove budget ID from arrBudget in the referenced header
    if (budget.header) {
        await Header.findByIdAndUpdate(budget.header, {
            $pull: { arrBudget: id }
        });
    }

    // Remove budget ID from arrBudget in the project
    if (budget.project) {
        await Project.findByIdAndUpdate(budget.project, {
            $pull: { arrBudget: id }
        });
    }

    // Delete the budget
    const result = await Budget.findByIdAndDelete(id);
    return result !== null;
}
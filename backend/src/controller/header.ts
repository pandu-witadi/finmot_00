import { Header } from '../model/header.js';
import { Project } from '../model/project.js';
import mongoose from 'mongoose';

export interface HeaderResponse {
    id: string;
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    project: string;
    arrBudget: string[];
    order: number;
    updatedBy: string;
    createdAt: Date;
}

export interface CreateHeaderRequest {
    name: string;
    tags?: string[];
    active?: boolean;
    type: 'income' | 'expense';
    project: string;
    arrBudget?: string[];
    order?: number;
    updatedBy?: string;
}

export interface UpdateHeaderRequest {
    name?: string;
    tags?: string[];
    active?: boolean;
    type?: 'income' | 'expense';
    project?: string;
    arrBudget?: string[];
    order?: number;
    updatedBy?: string;
}

export interface HeaderFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    tags?: string[];
    search?: string;
}

export interface HeaderSort {
    field?: 'name' | 'amount' | 'createdAt' | 'order';
    order?: 'asc' | 'desc';
}

export interface GetHeadersQuery {
    filter?: HeaderFilter;
    sort?: HeaderSort;
    limit?: number;
    offset?: number;
}

function headerToResponse(header: any): HeaderResponse {
    return {
        id: header._id.toString(),
        name: header.name,
        tags: header.tags,
        active: header.active,
        type: header.type,
        project: header.project.toString(),
        arrBudget: header.arrBudget.map((id: any) => id.toString()),
        order: header.order ?? 0,
        updatedBy: header.updatedBy.toString(),
        createdAt: header.createdAt,
    };
}

export async function getHeaderById(id: string): Promise<HeaderResponse | null> {
    const header = await Header.findById(id);
    if (!header) {
        return null;
    }
    return headerToResponse(header);
}

export async function getAllHeaders(query?: GetHeadersQuery): Promise<HeaderResponse[]> {
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

    const headersQuery = Header.find(mongoQuery);
    
    let headers = await headersQuery;
    
    // Sort headers by the project's arrHeader order if available
    if (filter && filter.project) {
        const project = await Project.findById(filter.project).select('arrHeader');
        if (project && project.arrHeader && project.arrHeader.length > 0) {
            const projectArrHeader = project.arrHeader.map((id: any) => id.toString());
            headers.sort((a: any, b: any) => {
                const aIndex = projectArrHeader.indexOf(a._id.toString());
                const bIndex = projectArrHeader.indexOf(b._id.toString());
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
            });
        }
    } else {
        // Fallback to sorting by order field
        const sortField = sort?.field || 'order';
        const sortOrder = sort?.order === 'asc' ? 1 : (sort?.order === 'desc' ? -1 : 1);
        headers.sort((a: any, b: any) => {
            if (sortOrder === 1) {
                return a[sortField] - b[sortField];
            } else {
                return b[sortField] - a[sortField];
            }
        });
    }

    if (offset !== undefined && offset > 0) {
        headers = headers.slice(offset);
    }

    if (limit !== undefined && limit > 0) {
        headers = headers.slice(0, limit);
    }
    
    return headers.map(headerToResponse);
}

export async function createHeader(body: CreateHeaderRequest): Promise<HeaderResponse> {
    let order = body.order ?? 0;
    
    if (body.order === undefined) {
        const lastHeader = await Header.findOne({ project: body.project })
            .sort({ order: -1 })
            .lean();
        order = lastHeader ? lastHeader.order + 1 : 0;
    }
    
    const header = new Header({
        name: body.name.trim(),
        tags: body.tags ?? [],
        active: body.active ?? true,
        type: body.type,
        project: body.project,
        arrBudget: body.arrBudget ?? [],
        order: order,
        updatedBy: body.updatedBy || "000000000000000000000000",
    });
    await header.save();
    
    // Add header ID to project's arrHeader
    await Project.findByIdAndUpdate(body.project, {
        $push: { arrHeader: header._id }
    });
    
    return headerToResponse(header);
}

export async function updateHeader(id: string, body: UpdateHeaderRequest): Promise<HeaderResponse | null> {
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

    if (body.project !== undefined) {
        updateFields.project = body.project;
    }

    if (body.arrBudget !== undefined) {
        updateFields.arrBudget = body.arrBudget;
    }

    if (body.order !== undefined) {
        updateFields.order = body.order;
    }

    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = body.updatedBy;
    }

    const header = await Header.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!header) {
        return null;
    }

    return headerToResponse(header);
}

export async function deleteHeader(id: string): Promise<boolean> {
    // Find the header first to get its project reference
    const header = await Header.findById(id);
    if (!header) {
        return false;
    }

    // Remove header ID from arrHeader in the project
    if (header.project) {
        await Project.findByIdAndUpdate(header.project, {
            $pull: { arrHeader: id }
        });
    }

    // Delete the header
    const result = await Header.findByIdAndDelete(id);
    return result !== null;
}

// Backward compatibility wrappers
export const getBudgetHeaderById = getHeaderById;
export const getAllBudgetHeaders = getAllHeaders;
export const createBudgetHeader = createHeader;
export const updateBudgetHeader = updateHeader;
export const deleteBudgetHeader = deleteHeader;

// Backward compatibility type exports
export type BudgetHeaderResponse = HeaderResponse;
export type CreateBudgetHeaderRequest = CreateHeaderRequest;
export type UpdateBudgetHeaderRequest = UpdateHeaderRequest;
export type BudgetHeaderFilter = HeaderFilter;
export type BudgetHeaderSort = HeaderSort;
export type GetBudgetHeadersQuery = GetHeadersQuery;
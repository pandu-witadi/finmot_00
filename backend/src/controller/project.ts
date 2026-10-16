import { Project } from '../model/project.js';
import mongoose from 'mongoose';

export interface ProjectResponse {
    id: string;
    code: string;
    name: string;
    note: string;
    active: boolean;
    done: boolean;
    typ: 'project' | 'routine' | 'other';
    tags: string[];
    stDate: Date;
    endDate: Date | null;
    arrHeader: string[];
    arrBudget: string[];
    arrActual: string[];
    arrTransaction: string[];
    updatedBy: string;
    createdAt: Date;
}

export interface CreateProjectRequest {
    code: string;
    name: string;
    note?: string;
    active?: boolean;
    done?: boolean;
    typ?: 'project' | 'routine' | 'other';
    tags?: string[];
    stDate?: Date;
    endDate?: Date;
    arrHeader?: string[];
    arrBudget?: string[];
    arrActual?: string[];
    arrTransaction?: string[];
    updatedBy?: string;
}

export interface UpdateProjectRequest {
    code?: string;
    name?: string;
    note?: string;
    active?: boolean;
    done?: boolean;
    typ?: 'project' | 'routine' | 'other';
    tags?: string[];
    stDate?: Date;
    endDate?: Date;
    arrHeader?: string[];
    arrBudget?: string[];
    arrActual?: string[];
    arrTransaction?: string[];
    updatedBy?: string;
}

export interface ProjectFilter {
    year?: number;
    active?: boolean;
    done?: boolean;
    typ?: 'project' | 'routine' | 'other';
    tags?: string[];
    search?: string;
}

export interface ProjectSort {
    field?: 'stDate' | 'endDate' | 'createdAt' | 'code' | 'name';
    order?: 'asc' | 'desc';
}

export interface GetProjectsQuery {
    filter?: ProjectFilter;
    sort?: ProjectSort;
    limit?: number;
    offset?: number;
}

function projectToResponse(project: any): ProjectResponse {
    return {
        id: project._id.toString(),
        code: project.code,
        name: project.name,
        note: project.note,
        active: project.active,
        done: project.done,
        typ: project.typ,
        tags: project.tags,
        stDate: project.stDate,
        endDate: project.endDate,
        arrHeader: (project.arrHeader || []).map((id: any) => id.toString()),
        arrBudget: (project.arrBudget || []).map((id: any) => id.toString()),
        arrActual: (project.arrActual || []).map((id: any) => id.toString()),
        arrTransaction: (project.arrTransaction || []).map((id: any) => id.toString()),
        updatedBy: project.updatedBy.toString(),
        createdAt: project.createdAt,
    };
}

export async function getProjectById(id: string): Promise<ProjectResponse | null> {
    const project = await Project.findById(id);
    if (!project) {
        return null;
    }
    return projectToResponse(project);
}

export async function getAllProjects(query?: GetProjectsQuery): Promise<ProjectResponse[]> {
    const { filter, sort, limit, offset } = query || {};

    const mongoQuery: any = {};
    
    if (filter) {
        if (filter.year !== undefined) {
            const startOfYear = new Date(filter.year, 0, 1);
            const endOfYear = new Date(filter.year, 11, 31, 23, 59, 59, 999);
            mongoQuery.stDate = { $gte: startOfYear, $lte: endOfYear };
        }

        if (filter.active !== undefined) {
            mongoQuery.active = filter.active;
        }

        if (filter.done !== undefined) {
            mongoQuery.done = filter.done;
        }

        if (filter.typ) {
            mongoQuery.typ = filter.typ;
        }

        if (filter.tags && filter.tags.length > 0) {
            mongoQuery.tags = { $in: filter.tags };
        }

        if (filter.search) {
            const searchRegex = new RegExp(filter.search, 'i');
            mongoQuery.$or = [
                { code: searchRegex },
                { name: searchRegex },
                { note: searchRegex },
            ];
        }
    }

    const sortField = sort?.field || 'createdAt';
    const sortOrder = sort?.order === 'asc' ? 1 : -1;

    const projectsQuery = Project.find(mongoQuery)
        .sort({ [sortField]: sortOrder });

    if (offset !== undefined && offset > 0) {
        projectsQuery.skip(offset);
    }

    if (limit !== undefined && limit > 0) {
        projectsQuery.limit(limit);
    }

    const projects = await projectsQuery;
    return projects.map(projectToResponse);
}

export async function createProject(body: CreateProjectRequest): Promise<ProjectResponse> {
    const project = new Project({
        code: body.code.trim(),
        name: body.name.trim(),
        note: body.note?.trim() || '',
        active: body.active ?? true,
        done: body.done ?? false,
        typ: body.typ ?? 'project',
        tags: body.tags ?? [],
        stDate: body.stDate ?? new Date(),
        endDate: body.endDate ?? null,
        arrHeader: body.arrHeader ?? [],
        arrBudget: body.arrBudget ?? [],
        arrActual: body.arrActual ?? [],
        arrTransaction: body.arrTransaction ?? [],
        updatedBy: body.updatedBy || "unknown",
    });
    await project.save();
    return projectToResponse(project);
}

export async function updateProject(id: string, body: UpdateProjectRequest): Promise<ProjectResponse | null> {
    const updateFields: any = {};
    
    if (body.code !== undefined && body.code.trim() !== '') {
        updateFields.code = body.code.trim();
    }
    
    if (body.name !== undefined && body.name.trim() !== '') {
        updateFields.name = body.name.trim();
    }
    
    if (body.note !== undefined) {
        updateFields.note = body.note.trim();
    }
    
    if (body.active !== undefined) {
        updateFields.active = body.active;
    }
    
    if (body.done !== undefined) {
        updateFields.done = body.done;
    }
    
    if (body.typ !== undefined) {
        updateFields.typ = body.typ;
    }
    
    if (body.tags !== undefined) {
        updateFields.tags = body.tags;
    }
    
    if (body.stDate !== undefined) {
        updateFields.stDate = body.stDate;
    }
    
    if (body.endDate !== undefined) {
        updateFields.endDate = body.endDate;
    }
    
    if (body.arrHeader !== undefined) {
        updateFields.arrHeader = body.arrHeader;
    }
    
    if (body.arrBudget !== undefined) {
        updateFields.arrBudget = body.arrBudget;
    }
    
    if (body.arrActual !== undefined) {
        updateFields.arrActual = body.arrActual;
    }
    
    if (body.arrTransaction !== undefined) {
        updateFields.arrTransaction = body.arrTransaction;
    }
    
    if (body.updatedBy !== undefined) {
        updateFields.updatedBy = body.updatedBy;
    }

    const project = await Project.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    if (!project) {
        return null;
    }

    return projectToResponse(project);
}

export async function deleteProject(id: string): Promise<boolean> {
    const result = await Project.findByIdAndDelete(id);
    return result !== null;
}
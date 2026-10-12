import { Project } from '../model/project.js';

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
    updatedBy?: string;
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

export async function getAllProjects(): Promise<ProjectResponse[]> {
    const projects = await Project.find().sort({ createdAt: -1 });
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
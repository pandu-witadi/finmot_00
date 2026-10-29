import { useState, useEffect } from "react";
import { projectApi } from "@/services/api";
import { userApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/context/authStore";

interface ProjectDetailInfoProps {
    project: any;
    onSave: (updatedProject: any) => void;
}

interface UserCache {
    [userId: string]: {
        name: string;
        loading: boolean;
    };
}

export function ProjectDetailInfo({ project, onSave }: ProjectDetailInfoProps) {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [userCache, setUserCache] = useState<UserCache>({});
    const [formData, setFormData] = useState({
        code: project.code,
        name: project.name,
        note: project.note || '',
        active: project.active,
        done: project.done,
        typ: project.typ,
        tags: project.tags.join(', '),
        stDate: project.stDate,
        endDate: project.endDate || '',
    });

    useEffect(() => {
        const loadUserName = async (userId: string) => {
            if (userCache[userId] || !userId || userId === user?.id) {
                return;
            }
            
            try {
                const response = await userApi.getById(userId);
                setUserCache(prev => ({
                    ...prev,
                    [userId]: { name: response.data.name || response.data.email || userId, loading: false }
                }));
            } catch (error) {
                setUserCache(prev => ({
                    ...prev,
                    [userId]: { name: userId, loading: false }
                }));
            }
        };

        if (project.updatedBy) {
            loadUserName(project.updatedBy);
        }
    }, [project.updatedBy, userCache, user?.id]);

    const getUserName = (userId: string) => {
        if (userId === user?.id) {
            return user?.name || user?.email || userId;
        }
        return userCache[userId]?.name || userId;
    };

    const handleSave = async () => {
        if (!user) {
            toast.error("User not authenticated");
            return;
        }

        try {
            const updateData: any = {
                code: formData.code.trim(),
                name: formData.name.trim(),
                note: formData.note.trim(),
                active: formData.active,
                done: formData.done,
                typ: formData.typ,
                tags: formData.tags
                    .split(',')
                    .map((t: string) => t.trim())
                    .filter((t: string) => t.length > 0),
                stDate: formData.stDate,
                endDate: formData.endDate || null,
                updatedBy: user.id,
            };

            const response = await projectApi.update(project.id, updateData);
            onSave(response.data);
            setIsEditing(false);
            toast.success("Project updated successfully");
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update project";
            toast.error(errorMessage);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isEditing) {
        return renderEditForm(project, formData, handleChange, handleSave, setIsEditing);
    }

    return renderViewMode(project, getUserName);
}

function renderEditForm(project: any, formData: any, handleChange: (field: string, value: any) => void, handleSave: () => void, setIsEditing: (v: boolean) => void) {
    return (
        <div className="space-y-4">
            <div className="bg-white p-8 rounded-lg border shadow-sm">
                <h2 className="text-2xl font-semibold mb-6">Edit Project</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Code</label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Type</label>
                        <select
                            value={formData.typ}
                            onChange={(e) => handleChange('typ', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        >
                            <option value="project">Project</option>
                            <option value="routine">Routine</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Active</label>
                        <select
                            value={formData.active ? 'true' : 'false'}
                            onChange={(e) => handleChange('active', e.target.value === 'true')}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Done</label>
                        <select
                            value={formData.done ? 'true' : 'false'}
                            onChange={(e) => handleChange('done', e.target.value === 'true')}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Start Date</label>
                        <input
                            type="date"
                            value={formData.stDate ? new Date(formData.stDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange('stDate', e.target.value ? new Date(e.target.value) : null)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">End Date</label>
                        <input
                            type="date"
                            value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Note</label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleChange('note', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-base text-base font-medium text-muted-foreground mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setFormData({
                                code: project.code,
                                name: project.name,
                                note: project.note || '',
                                active: project.active,
                                done: project.done,
                                typ: project.typ,
                                tags: project.tags.join(', '),
                                stDate: project.stDate,
                                endDate: project.endDate || '',
                            });
                        }}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function renderViewMode(project: any, getUserName: (userId: string) => string) {
    return (
        <div className="space-y-4">
            <div className="bg-white p-8 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Project Information</h2>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Edit
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">Code</p>
                        <p className="text-base font-medium">{project.code}</p>
                    </div>
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">Name</p>
                        <p className="text-base font-medium">{project.name}</p>
                    </div>
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">Type</p>
                        <p className="text-base font-medium capitalize">{project.typ}</p>
                    </div>
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">Status</p>
                        <div className="flex gap-2">
                            {project.active && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                    Active
                                </span>
                            )}
                            {project.done && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                                    Completed
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">Start Date</p>
                        <p className="text-base font-medium">{new Date(project.stDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-base text-base font-medium text-muted-foreground">End Date</p>
                        <p className="text-base font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-base text-base font-medium text-muted-foreground">Note</p>
                        <p className="text-base font-medium">{project.note || 'No note'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-base text-base font-medium text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {project.tags.length > 0 ? (
                                project.tags.map((tag: string, i: number) => (
                                    <span key={i} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted-foreground">No tags</span>
                            )}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <p className="text-base text-base font-medium text-muted-foreground">Updated By</p>
                        <p className="text-base font-medium">{project.updatedBy ? getUserName(project.updatedBy) : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
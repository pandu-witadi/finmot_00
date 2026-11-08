import { useState, useEffect } from "react";
import { projectApi } from "@/services/api";
import { userApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/context/authStore";
import { formatDate } from "@/utils/dateFormatters";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

    const handleClose = () => {
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
    };

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
                    .split(/\s*,\s*/)
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

    return (
        <>
            {renderViewMode(project, getUserName, setIsEditing)}
            <Dialog open={isEditing} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Update project details
                        </DialogDescription>
                    </DialogHeader>
                    {renderEditForm(project, formData, handleChange, handleSave, setIsEditing)}
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function renderEditForm(project: any, formData: any, handleChange: (field: string, value: any) => void, handleSave: () => void, setIsEditing: (v: boolean) => void) {
    return (
        <div className="grid gap-4 py-4">
            <div className="col-span-2">
                <Label htmlFor="editCode">Code</Label>
                <Input
                    id="editCode"
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="col-span-2">
                <Label htmlFor="editName">Name</Label>
                <Input
                    id="editName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full"
                />
            </div>
            <div>
                <Label htmlFor="editTyp">Type</Label>
                <select
                    id="editTyp"
                    value={formData.typ}
                    onChange={(e) => handleChange('typ', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                    <option value="project">Project</option>
                    <option value="routine">Routine</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <Label htmlFor="editActive">Active</Label>
                <select
                    id="editActive"
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => handleChange('active', e.target.value === 'true')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>
            <div>
                <Label htmlFor="editDone">Done</Label>
                <select
                    id="editDone"
                    value={formData.done ? 'true' : 'false'}
                    onChange={(e) => handleChange('done', e.target.value === 'true')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>
            <div>
                <Label htmlFor="editStDate">Start Date</Label>
                <Input
                    id="editStDate"
                    type="date"
                    value={formData.stDate ? new Date(formData.stDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('stDate', e.target.value ? new Date(e.target.value) : null)}
                    className="w-full"
                />
            </div>
            <div>
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                    id="editEndDate"
                    type="date"
                    value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="col-span-2">
                <Label htmlFor="editNote">Note</Label>
                <textarea
                    id="editNote"
                    value={formData.note}
                    onChange={(e) => handleChange('note', e.target.value)}
                    className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2"
                />
            </div>
            <div className="col-span-2">
                <Label htmlFor="editTags">Tags (comma-separated)</Label>
                <Input
                    id="editTags"
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className="w-full"
                    placeholder="tag1, tag2"
                />
            </div>
        </div>
    );
}

function renderViewMode(project: any, getUserName: (userId: string) => string, setIsEditing: (v: boolean) => void) {
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
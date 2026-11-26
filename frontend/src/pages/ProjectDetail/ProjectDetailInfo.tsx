import { useState, useEffect } from "react";
import { projectApi } from "@/services/api";
import { userApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/context/authStore";
import { formatDateTime } from "@/utils/dateFormatters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DoneBadge } from "./components/DoneBadge";
import { ActiveBadge } from "./components/ActiveBadge";

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

interface EditForm {
    code: string;
    name: string;
    note: string;
    active: boolean;
    done: boolean;
    typ: string;
    tags: string;
    stDate: string | null;
    endDate: string | null;
}

export function ProjectDetailInfo({ project, onSave }: ProjectDetailInfoProps) {
    const { user } = useAuthStore();
    const [userCache, setUserCache] = useState<UserCache>({});
    const [editForm, setEditForm] = useState<EditForm>({
        code: project.code,
        name: project.name,
        note: project.note || '',
        active: project.active,
        done: project.done,
        typ: project.typ,
        tags: project.tags.join(', '),
        stDate: project.stDate,
        endDate: project.endDate,
    });
    const [isEditing, setIsEditing] = useState(false);

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

    useEffect(() => {
        setEditForm({
            code: project.code,
            name: project.name,
            note: project.note || '',
            active: project.active,
            done: project.done,
            typ: project.typ,
            tags: project.tags.join(', '),
            stDate: project.stDate,
            endDate: project.endDate,
        });
    }, [project]);

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
                code: editForm.code.trim(),
                name: editForm.name.trim(),
                note: editForm.note.trim(),
                active: editForm.active,
                done: editForm.done,
                typ: editForm.typ,
                tags: editForm.tags
                    .split(/\s*,\s*/)
                    .map((t: string) => t.trim())
                    .filter((t: string) => t.length > 0),
                stDate: editForm.stDate,
                endDate: editForm.endDate,
                updatedBy: user.id,
            };

            const response = await projectApi.update(project.id, updateData);
            onSave(response.data);
            setEditForm(response.data);
            setIsEditing(false);
            toast.success("Project updated successfully");
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update project";
            toast.error(errorMessage);
        }
    };

    const handleChange = (field: keyof EditForm, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <ActiveBadge active={project.active} />
                <DoneBadge done={project.done} />
            </div>

            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? "Edit Project" : "Project Information"}
                    </h1>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {!isEditing ? (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground">Code</Label>
                                    <div className="text-lg font-semibold">{project.code}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                    <div className="text-lg font-semibold">{project.name}</div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                    project.typ === 'project'
                                        ? 'bg-blue-100 text-blue-700'
                                        : project.typ === 'routine'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {project.typ === 'project' ? 'Project' : project.typ === 'routine' ? 'Routine' : 'Other'}
                                </span>
                            </div>
                            
                            {project.note && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Note</Label>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {project.note}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">
                                    Start: {project.stDate ? new Date(project.stDate).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    End: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                                </div>
                            </div>
                            
                            {project.tags && project.tags.length > 0 && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Tags</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {project.tags.map((tag: string, idx: number) => (
                                            <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Last updated: {formatDateTime(project.updatedAt)}</span>
                                </div>
                                {project.updatedBy && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {(() => {
                                            const user = getUserName(project.updatedBy);
                                            return <span>Updated by: {user}</span>;
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t flex gap-2">
                                <Button variant="destructive" onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="editActive" className="whitespace-nowrap">Active</Label>
                                <Switch
                                    id="editActive"
                                    checked={editForm.active}
                                    onCheckedChange={(checked) => handleChange('active', checked)}
                                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                />
                                <span className={`text-sm font-medium ${editForm.active ? 'text-green-700' : 'text-red-600'}`}>
                                    {editForm.active ? 'Yes' : 'No'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Label htmlFor="editDone" className="whitespace-nowrap">Done</Label>
                                <Switch
                                    id="editDone"
                                    checked={editForm.done}
                                    onCheckedChange={(checked) => handleChange('done', checked)}
                                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                />
                                <span className={`text-sm font-medium ${editForm.done ? 'text-green-700' : 'text-red-600'}`}>
                                    {editForm.done ? 'Yes' : 'No'}
                                </span>
                            </div>
                            
                            <div>
                                <Label>Code *</Label>
                                <Input
                                    value={editForm.code}
                                    onChange={(e) => handleChange('code', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            
                            <div>
                                <Label>Type *</Label>
                                <div className="flex gap-2 mt-1">
                                    <Button
                                        type="button"
                                        onClick={() => handleChange('typ', 'project')}
                                        className={`flex-1 py-2 ${
                                            editForm.typ === 'project'
                                                ? 'bg-blue-200 border-blue-300 text-blue-800 hover:bg-blue-300'
                                                : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Project
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleChange('typ', 'routine')}
                                        className={`flex-1 py-2 ${
                                            editForm.typ === 'routine'
                                                ? 'bg-purple-200 border-purple-300 text-purple-800 hover:bg-purple-300'
                                                : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Routine
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleChange('typ', 'other')}
                                        className={`flex-1 py-2 ${
                                            editForm.typ === 'other'
                                                ? 'bg-gray-200 border-gray-300 text-gray-800 hover:bg-gray-300'
                                                : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Other
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={editForm.stDate ? new Date(editForm.stDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleChange('stDate', e.target.value ? new Date(e.target.value) : null)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={editForm.endDate ? new Date(editForm.endDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleChange('endDate', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <Label>Note</Label>
                                <textarea
                                    value={editForm.note}
                                    onChange={(e) => handleChange('note', e.target.value)}
                                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 resize-none"
                                    placeholder="Enter note"
                                />
                            </div>
                            
                            <div>
                                <Label>Tags</Label>
                                <Input
                                    value={editForm.tags}
                                    onChange={(e) => handleChange('tags', e.target.value)}
                                    className="mt-1"
                                    placeholder="tag1, tag2"
                                />
                            </div>

                            <div className="pt-4 border-t flex gap-2">
                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { actualApi, userApi, budgetApi } from "@/services/api";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDate, formatDateTime } from "@/utils/dateFormatters";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DoneBadge } from "@/pages/ProjectDetail/components/DoneBadge";
import { Switch } from "@/components/ui/switch";

interface User {
    id: string;
    name: string;
    email: string;
}

const filterUsers = (users: User[], searchTerm: string): User[] => {
    if (!users || users.length === 0) return [];
    return users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
};

function ActualDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [actual, setActual] = useState<any>(null);
    const [budget, setBudget] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<any>>({});
    const [isAssignToModalOpen, setIsAssignToModalOpen] = useState(false);
    const [assignToSearchTerm, setAssignToSearchTerm] = useState("");
    const [selectedAssignToUser, setSelectedAssignToUser] = useState<string>("");

    useEffect(() => {
        if (id) {
            loadActual();
            loadUsers();
        }
    }, [id]);

    const loadActual = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [actualRes, budgetRes] = await Promise.all([
                actualApi.getById(id),
                actualApi.getById(id).then(res => {
                    // Get budget info from the actual
                    return budgetApi.getById(res.data.budget);
                }).catch(() => null)
            ]);
            const data = actualRes.data;
            setActual(data);
            setBudget(budgetRes?.data || null);
            setEditForm(data);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load actual";
            toast.error(errorMessage);
            setLoading(false);
            navigate("/projects");
        }
    };

    const loadUsers = async () => {
        try {
            const res = await userApi.getAll();
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            }
        } catch (error: any) {
            console.debug("Failed to load users:", error);
        }
    };

    const handleOpenAssignToModal = () => {
        setSelectedAssignToUser(editForm.assignedTo || "");
        setAssignToSearchTerm("");
        setIsAssignToModalOpen(true);
    };

    const handleAssignToUserSelect = (userId: string) => {
        setSelectedAssignToUser(userId);
    };

    const handleAssignToUserSave = () => {
        setEditForm({ ...editForm, assignedTo: selectedAssignToUser });
        setIsAssignToModalOpen(false);
        setAssignToSearchTerm("");
        setSelectedAssignToUser("");
    };

    const filteredUsers = filterUsers(users, assignToSearchTerm);

    const handleSave = async () => {
        if (!id || !editForm.name) {
            toast.error("Actual name is required");
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: editForm.name.trim(),
                note: editForm.note,
                amount: editForm.amount,
                exDate: editForm.exDate,
                tags: editForm.tags || [],
                assignedTo: editForm.assignedTo,
                done: editForm.done,
            };
            
            const res = await actualApi.update(id, updateData);
            toast.success("Actual updated successfully");
            setActual(res.data);
            setEditForm(res.data);
            setEditMode(false);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update actual";
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditForm(actual || {});
    };

    const handleDelete = async () => {
        if (!id) return;
        
        if (window.confirm('Are you sure you want to delete this actual?')) {
            setLoading(true);
            try {
                await actualApi.delete(id);
                toast.success("Actual deleted successfully");
                navigate("/projects");
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to delete actual";
                toast.error(errorMessage);
                setLoading(false);
            }
        }
    };

    const getUserById = (userId: string | null) => {
        if (!userId || userId === "000000000000000000000000") return "—";
        const user = users.find(u => String(u.id) === String(userId));
        return user ? user.name : "Unknown";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!actual) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevrons-left">
                            <path d="m11 17-5-5 5-5"/>
                            <path d="m18 17-5-5 5-5"/>
                        </svg>
                    </Button>
                    <DoneBadge done={actual.done} />
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold">
                            {editMode ? "Edit Actual" : "Actual Details"}
                        </h1>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {!editMode ? (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                        <div className="text-lg font-semibold">{actual.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            actual.budgetType === 'income' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {getTypeLabel(actual.budgetType)}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            actual.budgetType === 'income' 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }`}>
                                            {formatNumber(actual.amount)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Execution Date</Label>
                                        <div className="text-sm">
                                            {formatDate(actual.exDate)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Assigned to</Label>
                                        <div className="text-sm">
                                            {getUserById(actual.assignedTo)}
                                        </div>
                                    </div>
                                </div>
                                
                                {actual.note && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Note</Label>
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {actual.note}
                                        </div>
                                    </div>
                                )}
                                
                                {actual.tags && actual.tags.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Tags</Label>
                                        <div className="flex flex-wrap gap-1">
                                            {actual.tags.map((tag: string, idx: number) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Budget</Label>
                                        <div className="text-sm font-medium text-primary">
                                            {budget ? budget.name : '—'}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Updated at: {formatDateTime(actual.updatedAt)}</span>
                                    </div>
                                    {actual.updatedBy && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            {(() => {
                                                const user = users.find(u => String(u.id) === String(actual.updatedBy));
                                                return <span>Updated by: {user ? user.name : actual.updatedBy}</span>;
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t flex gap-2">
                                    <Button onClick={() => setEditMode(true)}>
                                        Edit
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="done" className="whitespace-nowrap">Done</Label>
                                    <Switch
                                        id="done"
                                        checked={editForm.done || false}
                                        onCheckedChange={(checked) => setEditForm({ ...editForm, done: checked })}
                                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                                    />
                                    <span className={`text-sm font-medium ${editForm.done ? 'text-green-700' : 'text-red-600'}`}>
                                        {editForm.done ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                
                                <div>
                                    <Label>Name *</Label>
                                    <Input
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Amount *</Label>
                                    <Input
                                        type="number"
                                        value={editForm.amount || ''}
                                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                                        className="mt-1"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Type *</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Button
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, type: 'income' })}
                                            className={`flex-1 py-2 ${
                                                editForm.type === 'income'
                                                    ? 'bg-green-200 border-green-300 text-green-800 hover:bg-green-300'
                                                    : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Income
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, type: 'expense' })}
                                            className={`flex-1 py-2 ${
                                                editForm.type === 'expense'
                                                    ? 'bg-red-200 border-red-300 text-red-800 hover:bg-red-300'
                                                    : 'bg-transparent border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Expense
                                        </Button>
                                    </div>
                                </div>
                                
                                <div>
                                    <Label>Execution Date</Label>
                                    <Input
                                        type="date"
                                        value={editForm.exDate ? new Date(editForm.exDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditForm({ ...editForm, exDate: e.target.value ? new Date(e.target.value) : undefined })}
                                        className="mt-1"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Note</Label>
                                    <textarea
                                        value={editForm.note || ''}
                                        onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                        className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 resize-none"
                                        placeholder="Enter note"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Tags</Label>
                                    <Input
                                        value={editForm.tags?.join(', ') || ''}
                                        onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            tags: e.target.value.split(/\s*,\s*/).map(t => t.trim()).filter(t => t !== '') 
                                        })}
                                        className="mt-1"
                                        placeholder="tag1, tag2"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Assigned to</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={editForm.assignedTo ? getUserById(editForm.assignedTo) : ""}
                                            readOnly
                                            className="flex-1"
                                            placeholder="Click search button to select"
                                        />
                                        <Button type="button" variant="outline" onClick={handleOpenAssignToModal} className="h-9 w-9 px-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.3-4.3" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex gap-2">
                                    <Button variant="outline" onClick={handleCancel}>
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

                {/* Assign to User Modal */}
                <Dialog open={isAssignToModalOpen} onOpenChange={setIsAssignToModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Assign to User</DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-3 border-b">
                                <Input
                                    placeholder="Search users..."
                                    value={assignToSearchTerm}
                                    onChange={(e) => setAssignToSearchTerm(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            
                            <div className="flex-1 overflow-auto p-2 space-y-1">
                                {users.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                                        Loading users...
                                    </div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleAssignToUserSelect(user.id)}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${selectedAssignToUser === user.id ? 'bg-accent' : ''}`}
                                        >
                                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedAssignToUser === user.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
                                                {selectedAssignToUser === user.id && (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAssignToModalOpen(false);
                                    setAssignToSearchTerm("");
                                    setSelectedAssignToUser(editForm.assignedTo || "");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAssignToUserSave} disabled={!selectedAssignToUser}>
                                Select User
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

export default ActualDetail;
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { budgetApi, actualApi, userApi, headerApi } from "@/services/api";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDate, formatDateTime } from "@/utils/dateFormatters";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function BudgetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [budget, setBudget] = useState<any>(null);
    const [header, setHeader] = useState<any>(null);
    const [users, setUsers] = useState<{id: string, name: string}[]>([]);
    const [actuals, setActuals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<any>>({});

    useEffect(() => {
        if (id) {
            loadBudget();
            loadUsers();
        }
    }, [id]);

    const loadBudget = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [budgetRes, headerRes, actualsRes] = await Promise.all([
                budgetApi.getById(id),
                budgetApi.getById(id).then(res => {
                    return headerApi.getById(res.data.header);
                }).catch(() => null),
                budgetApi.getById(id).then(res => {
                    return actualApi.getByBudget(res.data.id);
                }).catch(() => ({ data: [] }))
            ]);
            const data = budgetRes.data;
            setBudget(data);
            setHeader(headerRes?.data || null);
            setActuals(actualsRes.data || []);
            setEditForm(data);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load budget";
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

    const handleSave = async () => {
        if (!id || !editForm.name) {
            toast.error("Budget name is required");
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: editForm.name.trim(),
                note: editForm.note,
                type: editForm.type,
                amount: editForm.amount,
                tags: editForm.tags || [],
            };
            
            const res = await budgetApi.update(id, updateData);
            toast.success("Budget updated successfully");
            setBudget(res.data);
            setEditForm(res.data);
            setEditMode(false);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update budget";
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditForm(budget || {});
    };

    const handleDelete = async () => {
        if (!id) return;
        
        if (window.confirm('Are you sure you want to delete this budget?')) {
            setLoading(true);
            try {
                await budgetApi.delete(id);
                toast.success("Budget deleted successfully");
                navigate("/projects");
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to delete budget";
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

    if (!budget) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 px-8 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold">
                            {editMode ? "Edit Budget" : "Budget Details"}
                        </h1>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {!editMode ? (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                        <div className="text-lg font-semibold">{budget.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            budget.type === 'income' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {getTypeLabel(budget.type)}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            budget.type === 'income' 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }`}>
                                            {formatNumber(budget.amount)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Header</Label>
                                    <div className="text-sm font-medium text-primary">
                                        {header ? header.name : '—'}
                                    </div>
                                </div>
                                
                                {budget.note && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Note</Label>
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {budget.note}
                                        </div>
                                    </div>
                                )}
                                
                                {budget.tags && budget.tags.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Tags</Label>
                                        <div className="flex flex-wrap gap-1">
                                            {budget.tags.map((tag: string, idx: number) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {actuals && actuals.length > 0 && (
                                    <div className="pt-4 border-t space-y-2">
                                        <Label className="text-xs text-muted-foreground">Connected actuals</Label>
                                        <div className="mt-2 space-y-2">
                                            {actuals.map((actual: any) => (
                                                <div key={actual.id} className="text-sm border rounded-lg p-3 bg-muted/30">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">{actual.name}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatNumber(actual.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Updated at: {formatDateTime(budget.updatedAt)}</span>
                                    </div>
                                    {budget.updatedBy && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            {(() => {
                                                const user = users.find(u => String(u.id) === String(budget.updatedBy));
                                                return <span>Updated by: {user ? user.name : budget.updatedBy}</span>;
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
                                <div>
                                    <Label>Name *</Label>
                                    <input
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Amount *</Label>
                                    <input
                                        type="number"
                                        value={editForm.amount || ''}
                                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2"
                                        min="0"
                                        step="0.01"
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
                                    <input
                                        value={editForm.tags?.join(', ') || ''}
                                        onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            tags: e.target.value.split(/\s*,\s*/).map(t => t.trim()).filter(t => t !== '') 
                                        })}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2"
                                        placeholder="tag1, tag2"
                                    />
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
            </div>
        </div>
    );
}

export default BudgetDetail;
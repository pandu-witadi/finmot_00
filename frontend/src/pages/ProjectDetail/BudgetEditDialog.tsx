import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDateTime } from "@/utils/dateFormatters";
import { useState, useEffect } from "react";
import { userApi } from "@/services/api";
import { EditBudgetForm } from "./types";

interface BudgetEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editBudgetForm: EditBudgetForm;
    setEditBudgetForm: React.Dispatch<React.SetStateAction<EditBudgetForm>>;
    onEditBudget: () => void;
    onDeleteBudget?: () => void;
    hasActuals: boolean;
}

export function BudgetEditDialog({
    isOpen,
    onOpenChange,
    editBudgetForm,
    setEditBudgetForm,
    onEditBudget,
    onDeleteBudget,
    hasActuals,
}: BudgetEditDialogProps) {
    const [users, setUsers] = useState<{id: string, name: string}[]>([]);
    const [viewMode, setViewMode] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

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

    const handleSave = () => {
        setViewMode(true);
        onEditBudget();
    };

    const handleCancel = () => {
        setViewMode(true);
        onOpenChange(false);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !viewMode) {
                handleCancel();
            } else if (!open && viewMode) {
                onOpenChange(false);
            }
        }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {viewMode ? "Budget Details" : "Edit Budget"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                    {viewMode ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                <div className="text-lg font-semibold">{editBudgetForm.name}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                    editBudgetForm.type === 'income'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {getTypeLabel(editBudgetForm.type)}
                                </span>
                                <span className={`text-2xl font-bold ${
                                    editBudgetForm.type === 'income'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}>
                                    {formatNumber(editBudgetForm.amount)}
                                </span>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Note</Label>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {editBudgetForm.note || '—'}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Tags</Label>
                                {editBudgetForm.tags && editBudgetForm.tags.trim().length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {editBudgetForm.tags
                                            .split(',')
                                            .map(t => t.trim())
                                            .filter(t => t.length > 0)
                                            .map((tag, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No tags</span>
                                )}
                            </div>
                            
                            {hasActuals && (
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-xs text-muted-foreground">Actuals connected:</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                        Cannot delete
                                    </span>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Updated at: {editBudgetForm.updatedAt && formatDateTime(editBudgetForm.updatedAt)}</span>
                                </div>
                                {editBudgetForm.updatedBy && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {(() => {
                                            const user = users.find(u => String(u.id) === String(editBudgetForm.updatedBy));
                                            return <span>Updated by: {user ? user.name : editBudgetForm.updatedBy}</span>;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="editBudgetName">Name</Label>
                                <Input
                                    id="editBudgetName"
                                    value={editBudgetForm.name}
                                    onChange={e => setEditBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="editBudgetType">Type</Label>
                                    <select
                                        id="editBudgetType"
                                        value={editBudgetForm.type}
                                        onChange={e => setEditBudgetForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="editBudgetAmount">Amount</Label>
                                    <Input
                                        id="editBudgetAmount"
                                        type="text"
                                        value={formatNumber(editBudgetForm.amount)}
                                        onChange={e => {
                                            const rawValue = e.target.value.replace(/\./g, '');
                                            setEditBudgetForm(prev => ({ ...prev, amount: parseFloat(rawValue) || 0 }));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editBudgetTags">Tags (comma-separated)</Label>
                                <Input
                                    id="editBudgetTags"
                                    value={editBudgetForm.tags}
                                    onChange={e => setEditBudgetForm(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="tag1, tag2"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editBudgetNote">Note</Label>
                                <textarea
                                    id="editBudgetNote"
                                    value={editBudgetForm.note}
                                    onChange={e => setEditBudgetForm(prev => ({ ...prev, note: e.target.value }))}
                                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 resize-none"
                                    placeholder="Enter note"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <DialogFooter className="flex justify-between">
                    {viewMode ? (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Close
                            </Button>
                            <Button onClick={() => setViewMode(false)}>
                                Edit
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            {!hasActuals && onDeleteBudget && (
                                <Button variant="destructive" onClick={onDeleteBudget}>
                                    Delete
                                </Button>
                            )}
                            <Button onClick={handleSave}>
                                Save
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
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
import { formatNumber, parseTags } from "@/utils/formatters";
import { formatDate, formatDateTime } from "@/utils/dateFormatters";
import { useState, useEffect } from "react";
import { userApi } from "@/services/api";
import { EditActualForm } from "./types";

interface ActualEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editActualForm: EditActualForm;
    setEditActualForm: React.Dispatch<React.SetStateAction<EditActualForm>>;
    onEditActual: () => void;
    onDeleteActual?: () => void;
    budgetName?: string;
    transactionName?: string;
    hasTransaction?: boolean;
}

export function ActualEditDialog({
    isOpen,
    onOpenChange,
    editActualForm,
    setEditActualForm,
    onEditActual,
    onDeleteActual,
    budgetName,
    transactionName,
    hasTransaction,
}: ActualEditDialogProps) {
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
        onEditActual();
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
                        {viewMode ? "Actual Details" : "Edit Actual"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                    {viewMode ? (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                <div className="text-lg font-semibold">{editActualForm.name}</div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                                <div className="text-2xl font-bold text-primary">
                                    {formatNumber(editActualForm.amount)}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-muted-foreground">Execution Date</Label>
                                <div className="text-sm">
                                    {formatDate(editActualForm.exDate)}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Assigned to</Label>
                                <div className="text-sm">
                                    {editActualForm.assignedTo && editActualForm.assignedTo !== "000000000000000000000000" ? (
                                        (() => {
                                            const user = users.find(u => String(u.id) === String(editActualForm.assignedTo));
                                            return user ? <span className="font-medium">{user.name}</span> : <span className="text-muted-foreground">{editActualForm.assignedTo}</span>;
                                        })()
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Note</Label>
                                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {editActualForm.note || '—'}
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Tags</Label>
                                {editActualForm.tags && editActualForm.tags.trim().length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {editActualForm.tags.split(',').map((tag, idx) => {
                                            const trimmedTag = tag.trim();
                                            return trimmedTag ? <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">{trimmedTag}</span> : null;
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">No tags</span>
                                )}
                            </div>
                            
                            {budgetName && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Budget</Label>
                                    <div className="text-sm font-medium text-primary">{budgetName}</div>
                                </div>
                            )}
                            
                            {transactionName && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Transaction</Label>
                                    <div className="text-sm font-medium text-primary">{transactionName}</div>
                                    {hasTransaction && (
                                        <span className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 block">
                                            ⚠ Warning: This actual is linked to a transaction
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Updated at: {formatDateTime(editActualForm.updatedAt)}</span>
                                </div>
                                {editActualForm.updatedBy && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {(() => {
                                            const user = users.find(u => String(u.id) === String(editActualForm.updatedBy));
                                            return <span>Updated by: {user ? user.name : editActualForm.updatedBy}</span>;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="editActualName">Name</Label>
                                <Input
                                    id="editActualName"
                                    value={editActualForm.name}
                                    onChange={e => setEditActualForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editActualAmount">Amount</Label>
                                <Input
                                    id="editActualAmount"
                                    type="text"
                                    value={formatNumber(editActualForm.amount)}
                                    onChange={e => {
                                        const rawValue = e.target.value.replace(/\./g, '');
                                        setEditActualForm(prev => ({ ...prev, amount: parseFloat(rawValue) || 0 }));
                                    }}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editActualExDate">Execution Date</Label>
                                <Input
                                    id="editActualExDate"
                                    type="date"
                                    value={new Date(editActualForm.exDate).toISOString().split('T')[0]}
                                    onChange={e => setEditActualForm(prev => ({ ...prev, exDate: new Date(e.target.value) }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editActualNote">Note</Label>
                                <textarea
                                    id="editActualNote"
                                    value={editActualForm.note || ''}
                                    onChange={e => setEditActualForm(prev => ({ ...prev, note: e.target.value }))}
                                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 resize-none"
                                    placeholder="Enter note"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editActualTags">Tags (comma-separated)</Label>
                                <Input
                                    id="editActualTags"
                                    value={editActualForm.tags}
                                    onChange={e => setEditActualForm(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="tag1, tag2"
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
                            {onDeleteActual && (
                                <Button variant="destructive" onClick={onDeleteActual}>
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
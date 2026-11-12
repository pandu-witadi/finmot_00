import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDate, formatDateTime } from "@/utils/dateFormatters";
import { useState, useEffect } from "react";
import { transactionApi, userApi, api } from "@/services/api";
import { toast } from "react-hot-toast";
import { Transaction } from "./useTransactions";

interface TransactionDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
    onSave: (updatedTransaction: Transaction) => void;
}

export function TransactionDetailDialog({ 
    isOpen, 
    onClose, 
    transactionId, 
    onSave 
}: TransactionDetailDialogProps) {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [users, setUsers] = useState<{id: string, name: string}[]>([]);
    const [actuals, setActuals] = useState<{id: string, name: string, project: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Transaction>>({});

    useEffect(() => {
        if (transactionId && isOpen) {
            loadTransaction();
            loadUsers();
            loadActuals();
        }
    }, [transactionId, isOpen]);

    const loadTransaction = async () => {
        if (!transactionId) return;
        setLoading(true);
        try {
            const res = await transactionApi.getById(transactionId);
            const data = res.data;
            setTransaction(data);
            setEditForm(data);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load transaction";
            toast.error(errorMessage);
            setLoading(false);
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

    const loadActuals = async () => {
        if (!transaction) return;
        
        const actualIds = transaction.arrActual || [];
        
        if (actualIds.length === 0) {
            setActuals([]);
            return;
        }
        
        try {
            const res = await api.get('/actual');
            const allActuals = Array.isArray(res.data) ? res.data : [];
            
            // Build map using both 'id' and '_id' fields - ensure string keys
            const actualsMap: {[id: string]: any} = {};
            allActuals.forEach((a: any) => {
                const id = a.id || a._id;
                const idStr = String(id);
                if (idStr) {
                    actualsMap[idStr] = a;
                }
            });
            
            // Find connected actuals - ensure string keys for lookup
            const connectedActuals = [];
            for (const actualId of actualIds) {
                const idStr = String(actualId);
                const found = actualsMap[idStr];
                if (found) connectedActuals.push(found);
            }
            
            setActuals(connectedActuals.map(a => ({
                id: a.id || a._id || '',
                name: a.name || '',
                project: a.project || ''
            })));
        } catch (error: any) {
            console.error("[TransactionDetailDialog] Failed to load actuals:", error);
            setActuals([]);
        }
    };

    const handleSave = async () => {
        if (!transactionId || !editForm.name) {
            toast.error("Transaction name is required");
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: editForm.name.trim(),
                type: editForm.type,
                amount: editForm.amount,
                tags: editForm.tags || [],
                active: editForm.active !== undefined ? editForm.active : true,
                exDate: editForm.exDate,
                assignedTo: editForm.assignedTo,
            };
            
            const res = await transactionApi.update(transactionId, updateData);
            toast.success("Transaction updated successfully");
            onSave(res.data);
            setEditMode(false);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update transaction";
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!transactionId) return;
        
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            setLoading(true);
            try {
                await transactionApi.delete(transactionId);
                toast.success("Transaction deleted successfully");
                onClose();
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to delete transaction";
                toast.error(errorMessage);
                setLoading(false);
            }
        }
    };

    if (!isOpen || !transactionId) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && editMode) {
                handleCancel();
            } else if (!open && !editMode) {
                onClose();
            }
        }}>
            <DialogContent className="max-w-4xl" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>
                        {editMode ? "Edit Transaction" : "Transaction Details"}
                    </DialogTitle>
                </DialogHeader>
                
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Loading...
                    </div>
                ) : transaction ? (
                    <div className="space-y-4">
                        {!editMode ? (
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                        <div className="text-lg font-semibold">{transaction.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            transaction.type === 'income' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {getTypeLabel(transaction.type)}
                                        </span>
                                        <span className={`text-sm font-medium ${
                                            transaction.type === 'income' 
                                                ? 'text-green-600' 
                                                : 'text-red-600'
                                        }`}>
                                            {formatNumber(transaction.amount)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Assigned to</Label>
                                        <div className="text-sm">
                                            {(() => {
                                                if (!transaction.assignedTo || transaction.assignedTo === "000000000000000000000000") {
                                                    return <span className="text-muted-foreground">—</span>;
                                                }
                                                const user = users.find(u => String(u.id) === String(transaction.assignedTo));
                                                return user ? <span className="font-medium">{user.name}</span> : <span className="text-muted-foreground">Unknown</span>;
                                            })()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Ex Date</Label>
                                        <div className="text-sm">
                                            {transaction.exDate ? formatDate(transaction.exDate) : "—"}
                                        </div>
                                    </div>
                                </div>
                                
                                {transaction.tags && transaction.tags.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Tags</Label>
                                        <div className="flex flex-wrap gap-1">
                                            {transaction.tags.map((tag, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 pt-2">
                                    <span className="text-xs text-muted-foreground">Active:</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        transaction.active 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {transaction.active ? "Yes" : "No"}
                                    </span>
                                </div>
                                
                                {transaction.arrActual && transaction.arrActual.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="pt-4 border-t">
                                            <Label className="text-sm font-medium">Connected actuals</Label>
                                            <div className="mt-2 space-y-2">
                                                {actuals.map((actual, idx) => (
                                                    <div key={actual.id} className="text-sm border rounded-lg p-3 bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{idx + 1}. {actual.name}</span>
                                                            {actual.project && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Project: {actual.project}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">This transaction cannot be deleted while actuals are connected.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t space-y-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {transaction.updatedAt ? (
                                            <span>Updated at: {formatDateTime(transaction.updatedAt)}</span>
                                        ) : (
                                            <span>Updated at: N/A</span>
                                        )}
                                    </div>
                                    {transaction.updatedBy && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            {(() => {
                                                const user = users.find(u => String(u.id) === String(transaction.updatedBy));
                                                return <span>Updated by: {user ? user.name : transaction.updatedBy}</span>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label>Name *</Label>
                                    <Input
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Type *</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Button
                                            type="button"
                                            variant={editForm.type === 'income' ? 'default' : 'outline'}
                                            onClick={() => setEditForm({ ...editForm, type: 'income' })}
                                        >
                                            Income
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={editForm.type === 'expense' ? 'default' : 'outline'}
                                            onClick={() => setEditForm({ ...editForm, type: 'expense' })}
                                        >
                                            Expense
                                        </Button>
                                    </div>
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
                                    <Label>Tags</Label>
                                    <Input
                                        value={editForm.tags?.join(', ') || ''}
                                        onChange={(e) => setEditForm({ 
                                            ...editForm, 
                                            tags: e.target.value.split(/\s*,\s*/).map(t => t.trim()).filter(t => t !== '') 
                                        })}
                                        className="mt-1"
                                        placeholder="comma,separated,tags"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={editForm.active !== false}
                                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                        className="h-4 w-4 accent-primary"
                                    />
                                    <Label htmlFor="active">Active</Label>
                                </div>
                                
                                <div>
                                    <Label>Ex Date</Label>
                                    <Input
                                        type="date"
                                        value={editForm.exDate ? new Date(editForm.exDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setEditForm({ ...editForm, exDate: e.target.value ? new Date(e.target.value) : undefined })}
                                        className="mt-1"
                                    />
                                </div>
                                
                                <div>
                                    <Label>Assigned to</Label>
                                    <Select
                                        value={editForm.assignedTo || ''}
                                        onValueChange={(value) => setEditForm({ ...editForm, assignedTo: value })}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select user (empty for unassigned)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
                
                <DialogFooter className="flex justify-between">
                    {!editMode ? (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Close
                            </Button>
                            <Button onClick={() => setEditMode(true)}>
                                Edit
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            {!transaction?.arrActual || transaction.arrActual.length === 0 ? (
                                <Button variant="destructive" onClick={handleDelete}>
                                    Delete
                                </Button>
                            ) : null}
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
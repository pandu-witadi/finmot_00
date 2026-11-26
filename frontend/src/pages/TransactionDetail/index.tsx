import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { transactionApi, actualApi, userApi, api } from "@/services/api";
import { Transaction } from "../ProjectDetail/useTransactions";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function TransactionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [actuals, setActuals] = useState<{id: string, name: string, project: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Transaction>>({});
    const [isAssignToModalOpen, setIsAssignToModalOpen] = useState(false);
    const [assignToSearchTerm, setAssignToSearchTerm] = useState("");
    const [selectedAssignToUser, setSelectedAssignToUser] = useState("");

    useEffect(() => {
        if (id) {
            loadTransaction();
            loadUsers();
            loadActuals();
        }
    }, [id]);

    const loadTransaction = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await transactionApi.getById(id);
            const data = res.data;
            setTransaction(data);
            setEditForm(data);
            setLoading(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load transaction";
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
            
            const actualsMap: {[id: string]: any} = {};
            allActuals.forEach((a: any) => {
                const id = a.id || a._id;
                const idStr = String(id);
                if (idStr) {
                    actualsMap[idStr] = a;
                }
            });
            
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
            console.error("Failed to load actuals:", error);
            setActuals([]);
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
                done: editForm.done,
                exDate: editForm.exDate,
                assignedTo: editForm.assignedTo,
            };
            
            const res = await transactionApi.update(id, updateData);
            toast.success("Transaction updated successfully");
            setTransaction(res.data);
            setEditForm(res.data);
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
        setEditForm(transaction || {});
    };

    const handleDelete = async () => {
        if (!id) return;
        
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            setLoading(true);
            try {
                await transactionApi.delete(id);
                toast.success("Transaction deleted successfully");
                navigate("/projects");
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to delete transaction";
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

    if (!transaction) {
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
                    <DoneBadge done={transaction.done} />
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold">
                            {editMode ? "Edit Transaction" : "Transaction Details"}
                        </h1>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        {!editMode ? (
                            <div className="space-y-4">
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
                                            {getUserById(transaction.assignedTo)}
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
                                    <Input
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                
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
                                    <Label>Type *</Label>
                                    <Tabs
                                        value={editForm.type || 'income'}
                                        onValueChange={(value) => setEditForm({ ...editForm, type: value as 'income' | 'expense' })}
                                        className="mt-1"
                                    >
                                        <TabsList className="grid grid-cols-2">
                                            <TabsTrigger value="income" className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800 data-[state=active]:border-green-300">
                                                Income
                                            </TabsTrigger>
                                            <TabsTrigger value="expense" className="data-[state=active]:bg-red-200 data-[state=active]:text-red-800 data-[state=active]:border-red-300">
                                                Expense
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
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
                                        placeholder="tag1, tag2"
                                    />
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

export { TransactionDetail };
export default TransactionDetail;
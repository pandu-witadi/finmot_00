import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTransactions } from "./useTransactions";
import { transactionApi } from "@/services/api";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDate } from "@/utils/dateFormatters";
import { userApi, api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";
import { Actual } from "./useActuals";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TransactionForm {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
    active: boolean;
    exDate: Date;
}

interface ProjectTransactionsProps {
    projectId: string;
    projectName: string;
}

// Transaction Sortable Row
function TransactionSortableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className={disabled ? '' : 'cursor-move hover:bg-muted/50 border-b border-border'}>
            {children}
        </tr>
    );
}

export function ProjectTransactions({ projectId }: ProjectTransactionsProps) {
    const navigate = useNavigate();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [form, setForm] = useState<TransactionForm>({
        name: '',
        type: 'expense',
        amount: 0,
        tags: '',
        active: true,
        exDate: new Date(),
    });
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set<string>());
    const [users, setUsers] = useState<{id: string, name: string, email: string}[]>([]);
    const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
    const [searchNameTerm, setSearchNameTerm] = useState("");
    const [searchTagTerm, setSearchTagTerm] = useState("");
    const [searchAssignedTerm, setSearchAssignedTerm] = useState("");
    const [isAssignToMenuOpen, setIsAssignToMenuOpen] = useState(false);
    const [assignToSearchTerm, setAssignToSearchTerm] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set<string>());
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [sortByExDate, setSortByExDate] = useState<'none' | 'asc' | 'desc'>('none');

    const {
        transactions,
        setTransactions,
        isLoading,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useTransactions(projectId);

    const [allActuals, setAllActuals] = useState<Actual[]>([]);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const res = await userApi.getAll();
                if (Array.isArray(res.data)) {
                    setUsers(res.data);
                }
            } catch (error: any) {
                console.debug("Failed to load users for transactions:", error);
            }
        };
        const loadProjects = async () => {
            try {
                const res = await api.get('/project');
                const projectsData = Array.isArray(res.data) ? res.data : [];
                const projectsList = projectsData.map((p: any) => ({ id: p._id || p.id, name: p.name }));
                setAllProjects(projectsList);
            } catch (error: any) {
                console.debug("Failed to load projects for transactions:", error);
            }
        };
        const loadAllActuals = async () => {
            try {
                const allActualsRes = await api.get('/actual');
                if (Array.isArray(allActualsRes.data)) {
                    setAllActuals(allActualsRes.data);
                }
            } catch (error: any) {
                console.debug("Failed to load all actuals for transactions:", error);
            }
        };
        loadUsers();
        loadProjects();
        loadAllActuals();
    }, []);

    const handleAddTransaction = async () => {
        if (!form.name.trim()) {
            toast.error("Transaction name is required");
            return;
        }

        try {
            await createTransaction({
                name: form.name.trim(),
                type: form.type,
                amount: form.amount,
                tags: form.tags ? form.tags.split(/\s*,\s*/).map(t => t.trim()).filter(t => t !== '') : [],
                active: form.active,
                project: projectId,
                exDate: form.exDate,
            });
            setIsAddDialogOpen(false);
            setForm({
                name: '',
                type: 'expense',
                amount: 0,
                tags: '',
                active: true,
                exDate: new Date(),
            });
        } catch (error) {
            console.error("Failed to add transaction:", error);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedTransactionIds.size === 0) {
            toast.error("No transactions selected");
            return;
        }

        if (!window.confirm(`Delete ${selectedTransactionIds.size} selected transaction(s)?`)) {
            return;
        }

        try {
            await Promise.all(Array.from(selectedTransactionIds).map(id => deleteTransaction(id)));
            toast.success(`${selectedTransactionIds.size} transaction(s) deleted successfully`);
            setSelectedTransactionIds(new Set<string>());
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete transactions";
            toast.error(errorMessage);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const nameMatch = t.name.toLowerCase().includes(searchNameTerm.toLowerCase());
        const tagMatch = searchTagTerm === '' || t.tags.some(tag => tag.toLowerCase().includes(searchTagTerm.toLowerCase()));
        const assignedMatch = searchAssignedTerm === '' || getUserById(t.assignedTo).toLowerCase().includes(searchAssignedTerm.toLowerCase());
        const typeMatch = filterType === 'all' || t.type === filterType;
        return nameMatch && tagMatch && assignedMatch && typeMatch;
    });

    const handleTransactionClick = (id: string) => {
        navigate(`/transactions/${id}`);
    };

    const getUserById = (userId: string | null) => {
        if (!userId || userId === "000000000000000000000000") return "—";
        const user = users.find(u => String(u.id) === String(userId));
        return user ? user.name : "Unknown";
    };

    const handleAssignTo = async () => {
        if (selectedTransactionIds.size === 0) return;

        const user_ids = Array.from(selectedUsers);
        if (user_ids.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (!window.confirm(`Assign ${selectedTransactionIds.size} selected transaction(s) to ${user_ids.length} user(s)?`)) {
            return;
        }

        try {
            await Promise.all(Array.from(selectedTransactionIds).map(transactionId => 
                updateTransaction(transactionId, { assignedTo: Array.from(selectedUsers)[0] })
            ));
            toast.success(`${selectedTransactionIds.size} transaction(s) assigned successfully`);
            setSelectedTransactionIds(new Set<string>());
            setSelectedUsers(new Set<string>());
            setIsAssignToMenuOpen(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to assign transactions";
            toast.error(errorMessage);
        }
    };

    // Create projects map for lookup
    const projectsMap = new Map(allProjects.map((p: any) => [p.id, p.name]));

    // Apply filters and date sorting for display only
    const filteredAndSortedTransactions = [...filteredTransactions].sort((a, b) => {
        if (sortByExDate === 'none') return 0;
        const aDate = a.exDate ? new Date(a.exDate).getTime() : 0;
        const bDate = b.exDate ? new Date(b.exDate).getTime() : 0;
        let cmp = aDate - bDate;
        if (sortByExDate === 'desc') cmp = -cmp;
        return cmp;
    });

    // Map transactions to their actuals
    const actualsMap = new Map(allActuals.map(a => [a.id, a]));
    const transactionActualsMap: {[transactionId: string]: {actual: Actual, projectName: string, project: string}[]} = {};
    filteredAndSortedTransactions.forEach(transaction => {
        const uniqueActualIds = Array.from(new Set(transaction.arrActual || []));
        const transactionActuals = uniqueActualIds
            .map(actualId => {
                const actual = actualsMap.get(actualId);
                if (!actual) return null;
                const projectName = projectsMap.get(actual.project) || '';
                return { actual, projectName, project: String(actual.project) };
            })
            .filter((item): item is {actual: Actual, projectName: string, project: string} => item !== null);
        if (transactionActuals.length > 0) {
            transactionActualsMap[transaction.id] = transactionActuals;
        }
    });

    const toggleSelectTransaction = (transactionId: string) => {
        const newSet = new Set(selectedTransactionIds);
        newSet.has(transactionId) ? newSet.delete(transactionId) : newSet.add(transactionId);
        setSelectedTransactionIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedTransactionIds.size === filteredAndSortedTransactions.length) {
            setSelectedTransactionIds(new Set<string>());
        } else {
            setSelectedTransactionIds(new Set(filteredAndSortedTransactions.map(t => t.id)));
        }
    };

    // Drag handler - directly modifies transactions array
    // transactions is sorted by position from backend, so drag works on correct order
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over || active.id === over.id) {
            return;
        }
        
        const activeIndex = transactions.findIndex(t => t.id === active.id);
        const overIndex = transactions.findIndex(t => t.id === over.id);
        
        if (activeIndex === -1 || overIndex === -1) {
            return;
        }
        
        const newTransactions = arrayMove(transactions, activeIndex, overIndex);
        setTransactions(newTransactions);
    };

    // Save positions - saves current transactions order
    const handleSavePositions = async () => {
        try {
            await transactionApi.updateBulkPosition(projectId, transactions.map(t => t.id));
            toast.success("Transaction positions saved successfully");
        } catch (error: any) {
            console.error("Failed to save transaction positions:", error);
            toast.error(error?.response?.data?.error || "Failed to save transaction positions");
        }
    };

    const selectedTotalAmount = Array.from(selectedTransactionIds).reduce((sum, id) => {
        const transaction = transactions.find(t => t.id === id);
        const sign = transaction?.type === 'income' ? 1 : -1;
        return sum + (transaction?.amount || 0) * sign;
    }, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        {selectedTransactionIds.size > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild={true}>
                                    <Button variant="destructive" className="h-8 px-2 text-xs">
                                        ({selectedTransactionIds.size}) sel
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDeleteSelected}>
                                        Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        setIsAssignToMenuOpen(true);
                                        const loadUsers = async () => {
                                            try {
                                                const res = await userApi.getAll();
                                                if (Array.isArray(res.data)) {
                                                    setUsers(res.data);
                                                }
                                            } catch (error: any) {
                                                toast.error("Failed to load users");
                                            }
                                        };
                                        loadUsers();
                                    }}>
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                                <circle cx="9" cy="7" r="4"/>
                                                <line x1="19" x2="19" y1="8" y2="14"/>
                                                <line x1="22" x2="16" y1="11" y2="11"/>
                                            </svg>
                                            <span>Assign to User</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleSavePositions}
                                    title="Save transaction positions"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <path d="M17 21v-8H7v8" />
                                        <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                                    </svg>
                                </Button>
                                <Input
                                    placeholder="Name"
                                    value={searchNameTerm}
                                    onChange={(e) => setSearchNameTerm(e.target.value)}
                                    className="h-8 w-24"
                                />
                                <Input
                                    placeholder="Tags"
                                    value={searchTagTerm}
                                    onChange={(e) => setSearchTagTerm(e.target.value)}
                                    className="h-8 w-24"
                                />
                                <Input
                                    placeholder="asgTo"
                                    value={searchAssignedTerm}
                                    onChange={(e) => setSearchAssignedTerm(e.target.value)}
                                    className="h-8 w-24"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild={true}>
                                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                                            Type: {filterType === 'all' ? 'All' : filterType === 'income' ? 'Income' : 'Expense'}
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setFilterType('all')}>
                                            All Types
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterType('income')}>
                                            Income
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterType('expense')}>
                                            Expense
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild={true}>
                                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                                            Sort: {sortByExDate === 'none' ? 'None' : sortByExDate === 'asc' ? 'Oldest' : 'Newest'}
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setSortByExDate('none')}>
                                            None
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortByExDate('asc')}>
                                            Oldest
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortByExDate('desc')}>
                                            Newest
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium">
                                Total: {formatNumber(selectedTotalAmount)}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DndContext onDragEnd={handleDragEnd}>
                        <SortableContext items={transactions.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[5%] bg-cyan-50">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primary"
                                                checked={selectedTransactionIds.size > 0 && selectedTransactionIds.size === filteredAndSortedTransactions.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[22%] bg-cyan-50">Name</TableHead>
                                        <TableHead className="w-[12%] bg-cyan-50">Tags</TableHead>
                                        <TableHead className="w-[12%] bg-cyan-50">Header</TableHead>
                                        <TableHead className="w-[6%] text-center bg-cyan-50">t</TableHead>
                                        <TableHead className="w-[12%] text-right bg-cyan-50">Amount</TableHead>
                                        <TableHead className="w-[6%] text-right bg-cyan-50">exDate</TableHead>
                                        <TableHead className="w-[9%] bg-cyan-50">asgTo</TableHead>
                                        <TableHead className="w-[25%] border-l-2 border-border bg-cyan-50">actName</TableHead>
                                        <TableHead className="w-[10%] text-right bg-cyan-50">actAmount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                No transactions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAndSortedTransactions.map((transaction) => (
                                            renderTransactionRow(
                                                transaction,
                                                transactionActualsMap[transaction.id] || [],
                                                toggleSelectTransaction,
                                                handleTransactionClick,
                                                selectedTransactionIds,
                                                getUserById
                                            )
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </SortableContext>
                    </DndContext>
                </CardContent>
            </Card>
            
            {isAddDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-[500px] max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Add Transaction</h3>
                            <p className="text-sm text-muted-foreground">Create a new transaction for this project</p>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Transaction name"
                                    className="h-9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type *</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={form.type === 'income' ? 'default' : 'outline'}
                                        onClick={() => setForm({ ...form, type: 'income' })}
                                        className="flex-1"
                                    >
                                        Income
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={form.type === 'expense' ? 'default' : 'outline'}
                                        onClick={() => setForm({ ...form, type: 'expense' })}
                                        className="flex-1"
                                    >
                                        Expense
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Amount *</label>
                                <Input
                                    type="number"
                                    value={form.amount || ''}
                                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-9"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tags</label>
                                <Input
                                    value={form.tags}
                                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                    placeholder="comma,separated,tags"
                                    className="h-9"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="active" className="text-sm font-medium">Active</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Date *</label>
                                <Input
                                    type="date"
                                    value={form.exDate.toISOString().split('T')[0]}
                                    onChange={(e) => setForm({ ...form, exDate: new Date(e.target.value) })}
                                    className="h-9"
                                />
                            </div>
                        </div>
                        
                        <div className="p-4 border-t flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAddTransaction}>
                                Create Transaction
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {isAssignToMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Assign to User</h3>
                            <p className="text-sm text-muted-foreground">Select users for {selectedTransactionIds.size} transaction(s)</p>
                        </div>
                        
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
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                users.filter(user => 
                                    user.name.toLowerCase().includes(assignToSearchTerm.toLowerCase()) ||
                                    user.email.toLowerCase().includes(assignToSearchTerm.toLowerCase())
                                ).map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => {
                                            const newSet = new Set(selectedUsers);
                                            newSet.has(user.id) ? newSet.delete(user.id) : newSet.add(user.id);
                                            setSelectedUsers(newSet);
                                        }}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${selectedUsers.has(user.id) ? 'bg-accent' : ''}`}
                                    >
                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUsers.has(user.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
                                            {selectedUsers.has(user.id) && (
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
                        
                        <div className="p-3 border-t flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAssignToMenuOpen(false);
                                    setAssignToSearchTerm("");
                                    setSelectedUsers(new Set<string>());
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAssignTo}>
                                Assign ({selectedUsers.size} selected)
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function renderTransactionRow(
    transaction: any,
    actuals: {actual: Actual, projectName: string, project: string}[],
    toggleSelectTransaction: (id: string) => void,
    onTransactionClick: (id: string) => void,
    selectedTransactionIds: Set<string>,
    getUserById: (userId: string | null) => string
) {
    const transactionId = transaction.id;
    const isDraggable = true;
    const hasActuals = actuals.length > 0;

    return (
        <TransactionSortableRow key={transactionId} id={transactionId} disabled={!isDraggable}>
            <TableCell className="px-2 py-3">
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={selectedTransactionIds.has(transactionId)}
                    onChange={() => toggleSelectTransaction(transactionId)}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                />
            </TableCell>
            <TableCell className="font-medium py-3">
                <div className="flex items-center gap-2">
                    <span
                        className="cursor-pointer hover:underline font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTransactionClick(transactionId);
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {transaction.name}
                    </span>
                </div>
            </TableCell>
            <TableCell className="text-sm py-3">
                {transaction.tags.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {transaction.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </TableCell>
            <TableCell className="w-[12%] text-sm text-muted-foreground py-3">—</TableCell>
            <TableCell className="text-center py-3">
                <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(transaction.type)}
                </span>
            </TableCell>
            <TableCell className="w-[12%] text-right py-3">
                <span className="text-xs font-medium">
                    {formatNumber(transaction.amount)}
                </span>
            </TableCell>
            <TableCell className="w-[6%] text-right text-sm text-muted-foreground py-3">
                {transaction.exDate ? <span className="text-xs">{formatDate(transaction.exDate)}</span> : '—'}
            </TableCell>
            <TableCell className="w-[9%] text-sm text-muted-foreground py-3">
                {transaction.assignedTo ? getUserById(transaction.assignedTo) : '—'}
            </TableCell>
            <TableCell className={`text-sm border-l-2 border-border py-3 ${hasActuals ? 'text-primary' : 'text-muted-foreground'}`}>
                {hasActuals ? (
                    <div className="flex flex-col">
                        {actuals.map((item, idx) => (
                            <div key={idx} className="border-b border-gray-200 pb-1 mb-1">
                                <span className="font-medium text-xs">{item.actual.name}</span>
                                {item.project && item.project !== '000000000000000000000000' ? (
                                    <Link
                                        to={`/projects/${item.project}?tab=actuals`}
                                        className="text-xs italic text-muted-foreground hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {item.projectName}
                                    </Link>
                                ) : (
                                    <span className="text-xs italic text-muted-foreground">
                                        {item.projectName}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </TableCell>
            <TableCell className={`text-right py-3 ${hasActuals ? 'font-medium' : 'text-muted-foreground'}`}>
                {hasActuals ? (
                    <div className="flex flex-col">
                        {actuals.map((item, idx) => (
                            <span key={idx} className="text-xs border-b border-gray-200 pb-1 mb-1">
                                {formatNumber(item.actual.amount)}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </TableCell>
        </TransactionSortableRow>
    );
}
import { useState, useEffect } from "react";
import { useTransactions } from "./useTransactions";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { formatDate } from "@/utils/dateFormatters";
import { userApi } from "@/services/api";
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
import { TrashIcon, PlusIcon } from "lucide-react";
import { TransactionDetailDialog } from "./TransactionDetailDialog";

interface TransactionForm {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
    active: boolean;
}

interface ProjectTransactionsProps {
    projectId: string;
}

export function ProjectTransactions({ projectId }: ProjectTransactionsProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [form, setForm] = useState<TransactionForm>({
        name: '',
        type: 'expense',
        amount: 0,
        tags: '',
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set<string>());
    const [users, setUsers] = useState<{id: string, name: string, email: string}[]>([]);

    const {
        transactions,
        isLoading,
        filter,
        setFilter,
        sort,
        setSort,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useTransactions(projectId);

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
        loadUsers();
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
            });
            setIsAddDialogOpen(false);
            setForm({
                name: '',
                type: 'expense',
                amount: 0,
                tags: '',
                active: true,
            });
        } catch (error) {
            console.error("Failed to add transaction:", error);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteTransaction(id);
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

    const filteredTransactions = transactions.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleTransactionClick = (id: string) => {
        setSelectedTransactionId(id);
        setIsDetailDialogOpen(true);
    };

    const handleTransactionSave = async (updatedTransactionData: any) => {
        if (!selectedTransactionId) return;
        await updateTransaction(selectedTransactionId, updatedTransactionData);
        setIsDetailDialogOpen(false);
        setSelectedTransactionId(null);
    };

    const getUserById = (userId: string | null) => {
        if (!userId || userId === "000000000000000000000000") return "—";
        const user = users.find(u => String(u.id) === String(userId));
        return user ? user.name : "Unknown";
    };

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        let cmp = 0;
        if (sort.field === 'name') {
            cmp = a.name.localeCompare(b.name);
        } else if (sort.field === 'amount') {
            cmp = a.amount - b.amount;
        } else if (sort.field === 'createdAt') {
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sort.order === 'asc' ? cmp : -cmp;
    });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {renderSummaryBar({ totalIncome, totalExpense, netAmount, setIsAddDialogOpen })}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        {selectedTransactionIds.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                    ({selectedTransactionIds.size}) selected
                                </span>
                                <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={handleDeleteSelected}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                        <div className={selectedTransactionIds.size > 0 ? "hidden" : ""}>
                            {renderTableHeader({ searchTerm, setSearchTerm, filter, setFilter, sort, setSort })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderTable({ sortedTransactions, handleDelete, getUserById, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick: handleTransactionClick })}
                </CardContent>
            </Card>
            {isAddDialogOpen && renderAddTransactionDialog({ form, setForm, handleAddTransaction, setIsAddDialogOpen })}
            {isDetailDialogOpen && selectedTransactionId && (
                <TransactionDetailDialog
                    isOpen={isDetailDialogOpen}
                    onClose={() => setIsDetailDialogOpen(false)}
                    transactionId={selectedTransactionId}
                    onSave={handleTransactionSave}
                />
            )}
        </div>
    );
}

interface SummaryBarProps {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    setIsAddDialogOpen: (v: boolean) => void;
}

function renderSummaryBar({ totalIncome, totalExpense, netAmount, setIsAddDialogOpen }: SummaryBarProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Transaction
                </Button>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-green-600 font-medium">Income:</span>
                    <span className="text-green-600 font-bold">{formatNumber(totalIncome)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">Expense:</span>
                    <span className="text-red-600 font-bold">{formatNumber(totalExpense)}</span>
                </div>
                <div className="flex items-center gap-2 border-l-2 border-border pl-4">
                    <span className="font-medium">Net:</span>
                    <span className={`font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(netAmount)}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface TableHeaderProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    filter: any;
    setFilter: (v: any) => void;
    sort: any;
    setSort: (v: any) => void;
}

function renderTableHeader({ searchTerm, setSearchTerm, filter, setFilter, sort, setSort }: TableHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3">
                            Type: {filter.type ? (filter.type === 'income' ? 'Income' : 'Expense') : 'All'}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setFilter({ ...filter, type: undefined })}>
                            All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter({ ...filter, type: 'income' })}>
                            Income
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter({ ...filter, type: 'expense' })}>
                            Expense
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3">
                            Sort: {sort.field === 'createdAt' ? 'Date' : sort.field === 'amount' ? 'Amount' : 'Name'}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSort({ field: 'createdAt', order: 'desc' })}>
                            Date (Newest)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'createdAt', order: 'asc' })}>
                            Date (Oldest)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'amount', order: 'desc' })}>
                            Amount (High to Low)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'amount', order: 'asc' })}>
                            Amount (Low to High)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'name', order: 'asc' })}>
                            Name (A-Z)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

interface TableProps {
    sortedTransactions: any[];
    handleDelete: (id: string) => void;
    getUserById: (userId: string) => string;
    selectedTransactionIds: Set<string>;
    setSelectedTransactionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    onTransactionClick: (id: string) => void;
}

function renderTable({ sortedTransactions, handleDelete, getUserById, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick }: TableProps) {
    const allSelected = sortedTransactions.length > 0 && sortedTransactions.every(t => selectedTransactionIds.has(t.id));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[5%]">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={allSelected}
                            onChange={() => {
                                if (allSelected) {
                                    setSelectedTransactionIds(new Set<string>());
                                } else {
                                    setSelectedTransactionIds(new Set(sortedTransactions.map(t => t.id)));
                                }
                            }}
                        />
                    </TableHead>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead className="w-[8%] text-center">t</TableHead>
                    <TableHead className="text-right w-[12%]">Amount</TableHead>
                    <TableHead className="w-[15%]">asgTo</TableHead>
                    <TableHead className="w-[25%]">Tags</TableHead>
                    <TableHead className="w-[10%]">exDate</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedTransactions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </TableCell>
                    </TableRow>
                ) : (
                    sortedTransactions.map((transaction) => (
                        <TransactionRow 
                            key={transaction.id} 
                            transaction={transaction} 
                            onDelete={handleDelete} 
                            getUserById={getUserById}
                            isSelected={selectedTransactionIds.has(transaction.id)}
                            onToggle={() => {
                                const newSet = new Set(selectedTransactionIds);
                                if (newSet.has(transaction.id)) {
                                    newSet.delete(transaction.id);
                                } else {
                                    newSet.add(transaction.id);
                                }
                                setSelectedTransactionIds(newSet);
                            }}
                            onNameClick={(e) => {
                                e.stopPropagation();
                                onTransactionClick(transaction.id);
                            }}
                        />
                    ))
                )}
            </TableBody>
        </Table>
    );
}

interface TransactionRowProps {
    transaction: any;
    onDelete: (id: string) => void;
    getUserById: (userId: string) => string;
    isSelected: boolean;
    onToggle: () => void;
    onNameClick: (e: React.MouseEvent) => void;
}

function TransactionRow({ transaction, onDelete, getUserById, isSelected, onToggle, onNameClick }: TransactionRowProps) {
    return (
        <TableRow key={transaction.id} className="cursor-pointer" onClick={onNameClick}>
            <TableCell className="px-2">
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isSelected}
                    onChange={onToggle}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                />
            </TableCell>
            <TableCell className="font-medium text-primary hover:underline">
                {transaction.name}
            </TableCell>
            <TableCell className="text-center">
                <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'income' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(transaction.type)}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <span className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                    {formatNumber(transaction.amount)}
                </span>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {getUserById(transaction.assignedTo)}
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {transaction.tags.length > 0 ? (
                        transaction.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-muted rounded-md">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {transaction.exDate ? <span className="text-xs">{formatDate(transaction.exDate)}</span> : '—'}
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(transaction.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <TrashIcon className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

interface AddTransactionDialogProps {
    form: TransactionForm;
    setForm: (v: TransactionForm) => void;
    handleAddTransaction: () => void;
    setIsAddDialogOpen: (v: boolean) => void;
}

function renderAddTransactionDialog({ form, setForm, handleAddTransaction, setIsAddDialogOpen }: AddTransactionDialogProps) {
    return (
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
    );
}

export default ProjectTransactions;
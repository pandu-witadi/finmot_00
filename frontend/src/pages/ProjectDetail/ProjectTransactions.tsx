import { useState, useEffect } from "react";
import { useTransactions } from "./useTransactions";
import { useActuals } from "./useActuals";
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
import { PlusIcon } from "lucide-react";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { Actual } from "./useActuals";

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
        exDate: new Date(),
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

    const { actuals } = useActuals(projectId);

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

    // Map transaction IDs to their actuals
    // Transaction.arrActual contains actual IDs
    const actualsMap: {[actualId: string]: Actual} = {};
    actuals.forEach(actual => {
        actualsMap[actual.id] = actual;
    });

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

    // Create a map of transaction ID -> array of actuals
    const transactionActualsMap: {[transactionId: string]: Actual[]} = {};
    sortedTransactions.forEach(transaction => {
        // Deduplicate actual IDs first
        const uniqueActualIds = Array.from(new Set(transaction.arrActual || []));
        const transactionActuals = uniqueActualIds.map(actualId => actualsMap[actualId]).filter(a => a !== undefined) as Actual[];
        if (transactionActuals.length > 0) {
            transactionActualsMap[transaction.id] = transactionActuals;
        }
    });

    // Flatten transactions with their actuals for display
    // Each transaction becomes one or more rows depending on actuals count
    type Row = { type: 'transaction'; transaction: any; actual: Actual | null; index: number };
    const flattenedRows: Row[] = [];
    sortedTransactions.forEach(transaction => {
        const transactionActuals = transactionActualsMap[transaction.id] || [];
        if (transactionActuals.length === 0) {
            flattenedRows.push({ type: 'transaction' as const, transaction, actual: null, index: 0 });
        } else {
            transactionActuals.forEach((actual, index) => {
                flattenedRows.push({ type: 'transaction' as const, transaction, actual, index });
            });
        }
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
                    {renderTable({ flattenedRows, transactionActualsMap, getUserById, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick: handleTransactionClick })}
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
    flattenedRows: any[];
    transactionActualsMap: {[transactionId: string]: Actual[]};
    getUserById: (userId: string) => string;
    selectedTransactionIds: Set<string>;
    setSelectedTransactionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    onTransactionClick: (id: string) => void;
}

function renderTable({ flattenedRows, transactionActualsMap, getUserById, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick }: TableProps) {
    const allSelected = flattenedRows.length > 0 && flattenedRows.every(r => selectedTransactionIds.has(r.transaction.id));

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[5%] bg-cyan-50">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={allSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                if (allSelected) {
                                    setSelectedTransactionIds(new Set<string>());
                                } else {
                                    setSelectedTransactionIds(new Set(flattenedRows.map(r => r.transaction.id)));
                                }
                            }}
                        />
                    </TableHead>
                    <TableHead className="w-[30%] bg-cyan-50">Name</TableHead>
                    <TableHead className="w-[25%] bg-cyan-50">Tags</TableHead>
                    <TableHead className="w-[8%] text-center bg-cyan-50">t</TableHead>
                    <TableHead className="text-right w-[10%] bg-cyan-50">Amount</TableHead>
                    <TableHead className="w-[15%] bg-cyan-50">asgTo</TableHead>
                    <TableHead className="w-[10%] bg-cyan-50">exDate</TableHead>
                    <TableHead className="w-[35%] bg-cyan-50">actName</TableHead>
                    <TableHead className="w-[15%] text-right bg-cyan-50">actAmount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {flattenedRows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </TableCell>
                    </TableRow>
                ) : (
                    flattenedRows.map((row) => (
                        <TransactionRow 
                            key={row.actual ? `${row.transaction.id}-actual-${row.index}` : row.transaction.id} 
                            transaction={row.transaction} 
                            actual={row.actual}
                            index={row.index}
                            transactionActualsMap={transactionActualsMap}
                            getUserById={getUserById}
                            isSelected={selectedTransactionIds.has(row.transaction.id)}
                            onToggle={() => {
                                const newSet = new Set(selectedTransactionIds);
                                if (newSet.has(row.transaction.id)) {
                                    newSet.delete(row.transaction.id);
                                } else {
                                    newSet.add(row.transaction.id);
                                }
                                setSelectedTransactionIds(newSet);
                            }}
                            onNameClick={(e) => {
                                e.stopPropagation();
                                onTransactionClick(row.transaction.id);
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
    actual: Actual | null;
    index: number;
    transactionActualsMap: {[transactionId: string]: Actual[]};
    getUserById: (userId: string) => string;
    isSelected: boolean;
    onToggle: () => void;
    onNameClick: (e: React.MouseEvent) => void;
}

function TransactionRow({ transaction, actual, index, transactionActualsMap, getUserById, isSelected, onToggle, onNameClick }: TransactionRowProps) {
    const transactionActuals = transactionActualsMap[transaction.id] || [];
    const hasActuals = transactionActuals.length > 0;
    
    const sharedCells = (
        <>
            <TableCell className="px-2 text-left" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                />
            </TableCell>
            <TableCell className="w-[30%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <div className="flex items-center gap-2">
                    <span
                        className="cursor-pointer hover:underline font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNameClick(e);
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {transaction.name}
                    </span>
                </div>
            </TableCell>
            <TableCell className="w-[25%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {transaction.tags.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {transaction.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </TableCell>
            <TableCell className="w-[8%] px-2 text-center border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(transaction.type)}
                </span>
            </TableCell>
            <TableCell className="w-[10%] text-right border-b border-gray-200 border-r border-magenta-300" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className="text-sm">
                    {formatNumber(transaction.amount)}
                </span>
            </TableCell>
            <TableCell className="w-[15%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {getUserById(transaction.assignedTo)}
            </TableCell>
            <TableCell className="w-[10%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {transaction.exDate ? <span className="text-xs">{formatDate(transaction.exDate)}</span> : '—'}
            </TableCell>
        </>
    );

    if (!hasActuals || !actual) {
        return (
            <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
                {sharedCells}
                <TableCell className="w-[35%] text-left border-b border-gray-200">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="w-[15%] text-right border-b border-gray-200">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
            </TableRow>
        );
    }

    const lastRowClass = index === transactionActuals.length - 1 ? "border-b border-gray-200" : "";

    return (
        <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
            {index === 0 && sharedCells}
            <TableCell className={`w-[35%] text-left ${lastRowClass}`}>
                <span 
                    className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground hover:underline cursor-pointer" 
                    title={actual.name}
                    onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open actual edit dialog
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                    }}
                >
                    {actual.name}
                </span>
            </TableCell>
            <TableCell className={`w-[15%] text-right ${lastRowClass}`}>
                <span className="text-sm text-muted-foreground">
                    {formatNumber(actual.amount)}
                </span>
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
    );
}

export default ProjectTransactions;
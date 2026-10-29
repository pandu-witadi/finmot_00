import { useState } from "react";
import { useTransactions } from "./useTransactions";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
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
    const [form, setForm] = useState<TransactionForm>({
        name: '',
        type: 'expense',
        amount: 0,
        tags: '',
        active: true,
    });
    const [searchTerm, setSearchTerm] = useState("");

    const {
        transactions,
        isLoading,
        filter,
        setFilter,
        sort,
        setSort,
        createTransaction,
        deleteTransaction,
    } = useTransactions(projectId);

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
                tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
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

    const filteredTransactions = transactions.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    {renderTableHeader({ searchTerm, setSearchTerm, filter, setFilter, sort, setSort })}
                </CardHeader>
                <CardContent>
                    {renderTable({ sortedTransactions, handleDelete })}
                </CardContent>
            </Card>
            {isAddDialogOpen && renderAddTransactionDialog({ form, setForm, handleAddTransaction, setIsAddDialogOpen })}
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
                    <DropdownMenuTrigger>
                        <Button variant="outline" size="sm">
                            Type: {filter.type ? (filter.type === 'income' ? 'Income' : 'Expense') : 'All'}
                        </Button>
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
                    <DropdownMenuTrigger>
                        <Button variant="outline" size="sm">
                            Sort: {sort.field === 'createdAt' ? 'Date' : sort.field === 'amount' ? 'Amount' : 'Name'}
                        </Button>
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
}

function renderTable({ sortedTransactions, handleDelete }: TableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead className="w-[10%] text-center">t</TableHead>
                    <TableHead className="text-right w-[15%]">Amount</TableHead>
                    <TableHead className="w-[25%]">Tags</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedTransactions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </TableCell>
                    </TableRow>
                ) : (
                    sortedTransactions.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} onDelete={handleDelete} />
                    ))
                )}
            </TableBody>
        </Table>
    );
}

interface TransactionRowProps {
    transaction: any;
    onDelete: (id: string) => void;
}

function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
    return (
        <TableRow key={transaction.id}>
            <TableCell className="font-medium">
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
            <TableCell className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
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
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTransactions } from "./useTransactions";
import { actualApi } from "@/services/api";
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
import { PlusIcon, UserPlusIcon } from "lucide-react";
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
    projectName: string;
}

export function ProjectTransactions({ projectId, projectName }: ProjectTransactionsProps) {
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
        return nameMatch && tagMatch && assignedMatch;
    });

    const handleTransactionClick = (id: string) => {
        navigate(`/transactions/${id}`);
    };

    const getUserById = (userId: string | null) => {
        if (!userId || userId === "000000000000000000000000") return "—";
        const user = users.find(u => String(u.id) === String(userId));
        return user ? user.name : "Unknown";
    };

    const loadUsers = async () => {
        if (users.length > 0) return;
        try {
            const res = await userApi.getAll();
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            }
        } catch (error: any) {
            toast.error("Failed to load users");
        }
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

    // Map transaction IDs to their actuals
    // Transaction.arrActual contains actual IDs
    const actualsMap: {[actualId: string]: Actual} = {};
    allActuals.forEach(actual => {
        actualsMap[actual.id] = actual;
    });

    // Create projects map for lookup
    const projectsMap = new Map(allProjects.map((p: any) => [p.id, p.name]));

    // Map actuals with their project names
    const actualsWithProject: {[actualId: string]: {actual: Actual, projectName: string}} = {};
    allActuals.forEach(actual => {
        const projectName = projectsMap.get(actual.project) || '';
        actualsWithProject[actual.id] = { actual, projectName };
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

    // Create a map of transaction ID -> array of actuals with project names
    const transactionActualsMap: {[transactionId: string]: {actual: Actual, projectName: string}[]} = {};
    sortedTransactions.forEach(transaction => {
        // Deduplicate actual IDs first
        const uniqueActualIds = Array.from(new Set(transaction.arrActual || []));
        const transactionActuals = uniqueActualIds.map(actualId => actualsWithProject[actualId]).filter(a => a !== undefined) as {actual: Actual, projectName: string}[];
        if (transactionActuals.length > 0) {
            transactionActualsMap[transaction.id] = transactionActuals;
        }
    });

    // Flatten transactions with their actuals for display
    // Each transaction becomes one or more rows depending on actuals count
    type Row = { type: 'transaction'; transaction: any; actual: {actual: Actual, projectName: string} | null; index: number };
    const flattenedRows: Row[] = [];
    sortedTransactions.forEach(transaction => {
        const transactionActuals = transactionActualsMap[transaction.id] || [];
        if (transactionActuals.length === 0) {
            flattenedRows.push({ type: 'transaction' as const, transaction, actual: null, index: 0 });
        } else {
            transactionActuals.forEach((actualWithProject, index) => {
                flattenedRows.push({ type: 'transaction' as const, transaction, actual: actualWithProject, index });
            });
        }
    });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

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
                                <DropdownMenuTrigger>
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
                                        loadUsers();
                                    }}>
                                        <div className="flex items-center gap-2">
                                            <UserPlusIcon className="w-4 h-4" />
                                            <span>Assign to User</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <div className={selectedTransactionIds.size > 0 ? "hidden" : ""}>
                            {renderTableHeader({ filter, setFilter, sort, setSort }, searchNameTerm, setSearchNameTerm, searchTagTerm, setSearchTagTerm, searchAssignedTerm, setSearchAssignedTerm)}
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium">
                                Total: {formatNumber(selectedTotalAmount)}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderTable({ flattenedRows, transactionActualsMap, getUserById, projectName, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick: handleTransactionClick })}
                </CardContent>
            </Card>
            
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

interface TableHeaderProps {
    filter: any;
    setFilter: (v: any) => void;
    sort: any;
    setSort: (v: any) => void;
}

function renderTableHeader({ filter, setFilter, sort, setSort }: TableHeaderProps, searchNameTerm: string, setSearchNameTerm: (v: string) => void, searchTagTerm: string, setSearchTagTerm: (v: string) => void, searchAssignedTerm: string, setSearchAssignedTerm: (v: string) => void) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
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
                            Sort: {sort.field === 'none' ? 'None' : sort.field === 'createdAt' ? 'Date' : sort.field === 'amount' ? 'Amount' : 'Name'}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSort({ field: 'none', order: 'asc' })}>
                            None
                        </DropdownMenuItem>
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
    transactionActualsMap: {[transactionId: string]: {actual: Actual, projectName: string}[]};
    getUserById: (userId: string) => string;
    projectName: string;
    selectedTransactionIds: Set<string>;
    setSelectedTransactionIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    onTransactionClick: (id: string) => void;
}

function renderTable({ flattenedRows, transactionActualsMap, getUserById, projectName, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick }: TableProps) {
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
                            onClick={(e) => e.stopPropagation()}
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
                    <TableHead className="w-[22%] bg-cyan-50">Name</TableHead>
                    <TableHead className="w-[8%] bg-cyan-50">Tags</TableHead>
                    <TableHead className="w-[4%] text-center bg-cyan-50">t</TableHead>
                    <TableHead className="text-right w-[7%] bg-cyan-50">Amount</TableHead>
                    <TableHead className="w-[6%] text-right bg-cyan-50">exDate</TableHead>
                    <TableHead className="w-[10%] bg-cyan-50">asgTo</TableHead>
                    <TableHead className="w-[12%] border-l-2 border-border bg-cyan-50">actName</TableHead>
                    <TableHead className="w-[8%] text-right bg-cyan-50">actAmount</TableHead>
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
    actual: {actual: Actual, projectName: string} | null;
    index: number;
    transactionActualsMap: {[transactionId: string]: {actual: Actual, projectName: string}[]};
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
            <TableCell className="w-[5%] px-2 text-left" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                />
            </TableCell>
            <TableCell className="w-[22%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
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
            <TableCell className="w-[8%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
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
            <TableCell className="w-[4%] px-2 text-center border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {getTypeLabel(transaction.type)}
                </span>
            </TableCell>
            <TableCell className="w-[7%] text-right border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                <span className="text-xs">
                    {formatNumber(transaction.amount)}
                </span>
            </TableCell>
            <TableCell className="w-[6%] px-2 text-right border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {transaction.exDate ? <span className="text-xs">{formatDate(transaction.exDate)}</span> : '—'}
            </TableCell>
            <TableCell className="w-[7%] px-2 text-left border-b border-gray-200" rowSpan={hasActuals ? transactionActuals.length : 1}>
                {getUserById(transaction.assignedTo)}
            </TableCell>
        </>
    );

    if (!hasActuals || !actual) {
        return (
            <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
                {sharedCells}
                <TableCell className="w-[22%] border-l-2 border-border text-left border-b border-gray-200">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="w-[9%] text-right border-b border-gray-200">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
            </TableRow>
        );
    }

    const lastRowClass = index === transactionActuals.length - 1 ? "border-b border-gray-200" : "";

    return (
        <TableRow key={transaction.id} className="cursor-pointer" onClick={(e) => onNameClick(e)}>
            {index === 0 && sharedCells}
                <TableCell className={`w-[22%] text-left ${lastRowClass} border-l-2 border-border`}>
                    <div className="flex flex-col">
                        <span 
                            className="font-medium text-primary cursor-pointer"
                            title={actual?.actual.name}
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Open actual edit dialog
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {actual?.actual.name}
                        </span>
                        {actual?.projectName && actual?.actual.project ? (
                            <Link 
                                to={`/projects/${actual.actual.project}?tab=actuals`}
                                className="text-xs italic text-muted-foreground hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {actual.projectName}
                            </Link>
                        ) : (
                            <span className="text-xs italic text-muted-foreground">
                                {actual?.projectName || ''}
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className={`w-[9%] text-right ${lastRowClass}`}>
                    <span className="text-xs text-muted-foreground">
                        {actual ? formatNumber(actual.actual.amount) : '-'}
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
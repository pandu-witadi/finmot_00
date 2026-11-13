import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "./useTransactions";
import { formatNumber } from "@/utils/formatters";
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
import { UserPlusIcon } from "lucide-react";
import { Actual } from "./useActuals";
import * as txHelpers from "./transactionHelpers.tsx";
import { TransactionRow } from "./transactionHelpers.tsx";

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

    const projectsMap = new Map(allProjects.map((p: any) => [p.id, p.name]));

    const handleTransactionClick = (id: string) => {
        navigate(`/transactions/${id}`);
    };

    const sortedTransactions = txHelpers.sortTransactions(
        txHelpers.filterTransactions(
            transactions,
            searchNameTerm,
            searchTagTerm,
            searchAssignedTerm,
            users
        ),
        (sort.field as 'exDate' | 'none') || 'none',
        (sort.order as 'asc' | 'desc' | 'none') || 'asc'
    );

    const transactionActualsMap = txHelpers.mapActualsToTransactions(sortedTransactions, allActuals, projectsMap);

    const { totalIncome, totalExpense } = txHelpers.calculateTransactionTotals(transactions);
    const selectedTotalAmount = txHelpers.calculateSelectedTotal(selectedTransactionIds, transactions);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const flattenedRows = txHelpers.flattenTransactionsWithActuals(sortedTransactions, transactionActualsMap);

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
                <AssignToMenu
                    users={users}
                    selectedTransactionIds={selectedTransactionIds}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    assignToSearchTerm={assignToSearchTerm}
                    setAssignToSearchTerm={setAssignToSearchTerm}
                    setIsAssignToMenuOpen={setIsAssignToMenuOpen}
                    handleAssignTo={handleAssignTo}
                />
            )}
        </div>
    );
}

// ============== Helper Components ==============

function renderTableHeader({ filter, setFilter, sort, setSort }: { filter: any; setFilter: (v: any) => void; sort: any; setSort: (v: any) => void }, searchNameTerm: string, setSearchNameTerm: (v: string) => void, searchTagTerm: string, setSearchTagTerm: (v: string) => void, searchAssignedTerm: string, setSearchAssignedTerm: (v: string) => void) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                            Type: {filter.type ? (filter.type === 'income' ? 'Income' : 'Expense') : 'All'}
                        </div>
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
                    <DropdownMenuTrigger asChild={true}>
                        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                            Sort: {sort.field === 'none' ? 'None' : sort.field === 'exDate' ? 'Date' : 'Name'}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSort({ field: 'none', order: 'asc' })}>
                            None
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'exDate', order: 'desc' })}>
                            Newest
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSort({ field: 'exDate', order: 'asc' })}>
                            Oldest
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

function renderTable({ flattenedRows, transactionActualsMap, getUserById, projectName, selectedTransactionIds, setSelectedTransactionIds, onTransactionClick }: txHelpers.TableProps) {
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

interface AssignToMenuProps {
    users: { id: string; name: string; email: string }[];
    selectedTransactionIds: Set<string>;
    selectedUsers: Set<string>;
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>;
    assignToSearchTerm: string;
    setAssignToSearchTerm: (v: string) => void;
    setIsAssignToMenuOpen: (v: boolean) => void;
    handleAssignTo: () => void;
}

function AssignToMenu({ users, selectedTransactionIds, selectedUsers, setSelectedUsers, assignToSearchTerm, setAssignToSearchTerm, setIsAssignToMenuOpen, handleAssignTo }: AssignToMenuProps) {
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(assignToSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(assignToSearchTerm.toLowerCase())
    );

    return (
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
                        filteredUsers.map(user => (
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
    );
}

export default ProjectTransactions;
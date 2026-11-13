import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { headerApi, budgetApi, actualApi, userApi, api, transactionApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlusIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Actual } from "./useActuals";
import { ActualEditDialog } from "./ActualEditDialog";
import { EditActualForm } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatNumber, getTypeLabel, parseTags } from "@/utils/formatters";
import { formatDate } from "@/utils/dateFormatters";

interface ProjectActualsProps {
    projectId: string;
    active: boolean;
    projectName: string;
}

interface TransactionInfo {
    id: string;
    name: string;
    amount: number;
    projectName: string;
    project: string;
}

interface ActualWithBudgetInfo extends Actual {
    headerName: string;
    headerId: string;
    headerOrder: number;
    budgetType: 'income' | 'expense';
    transaction?: TransactionInfo;
    assignedTo: string;
    assignedToName: string;
    exDate: Date;
}

interface User {
    id: string;
    name: string;
    email: string;
}

function ActualSortableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
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

export function ProjectActuals({ projectId, active, projectName }: ProjectActualsProps) {
    const navigate = useNavigate();
    const [actuals, setActuals] = useState<ActualWithBudgetInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [editActualForm, setEditActualForm] = useState<EditActualForm>({
        id: '',
        name: '',
        note: '',
        amount: 0,
        exDate: new Date(),
        tags: '',
        assignedTo: '',
        updatedAt: new Date(),
        updatedBy: ''
    });
    const [selectedActualIds, setSelectedActualIds] = useState<Set<string>>(new Set<string>());
    const [isAssignToMenuOpen, setIsAssignToMenuOpen] = useState(false);
    const [assignToSearchTerm, setAssignToSearchTerm] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set<string>());
    const [projectData, setProjectData] = useState<{ arrActual: string[] } | null>(null);
    const [searchNameTerm, setSearchNameTerm] = useState("");
    const [searchTagTerm, setSearchTagTerm] = useState("");
    const [searchHeaderTerm, setSearchHeaderTerm] = useState("");
    const [isRegisterToTransactionModalOpen, setIsRegisterToTransactionModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
    const [transactionsForSelectedProject, setTransactionsForSelectedProject] = useState<{ id: string; name: string }[]>([]);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [editActualBudgetName, setEditActualBudgetName] = useState("");
    const [editActualTransactionName, setEditActualTransactionName] = useState<string | undefined>();
    const [editActualHasTransaction, setEditActualHasTransaction] = useState(false);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [filterType, setFilterType] = useState<'income' | 'expense' | 'all'>('all');
    const [sortByDate, setSortByDate] = useState<'none' | 'asc' | 'desc'>('none');

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes, actualsRes, transactionsRes, projectsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId),
                actualApi.getAllByProject(projectId),
                api.get('/transaction'),
                api.get('/project')
            ]);

            // Load project data for arrActual order
            let projectDataRes: { arrActual: string[] } | null = null;
            try {
                const projectRes = await api.get(`/project/${projectId}`);
                projectDataRes = {
                    arrActual: projectRes.data.arrActual || []
                };
            } catch (err: any) {
                console.debug("Failed to load project data:", err);
            }
            setProjectData(projectDataRes);

            // Load all projects for the modal
            const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
            const projectsList = projectsData.map((p: any) => ({ id: p._id || p.id, name: p.name }));
            setAllProjects(projectsList);

            const headersData = Array.isArray(headersRes.data) ? headersRes.data : [];
            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            setBudgets(budgetsData);
            const actualsData = Array.isArray(actualsRes.data) ? actualsRes.data : [];
            const transactionsData = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
            
            // Load users separately - don't fail if this fails
            const allUsers: User[] = [];
            try {
                const usersRes = await userApi.getAll();
                if (Array.isArray(usersRes.data)) {
                    allUsers.push(...usersRes.data);
                }
            } catch (userError: any) {
                // Silent fail - users loading is optional
                console.debug("Failed to load users:", userError);
            }

            const projectsMap = new Map(projectsList.map((p: any) => [p.id, p.name]));
            
            const actualsWithInfo: ActualWithBudgetInfo[] = actualsData.map((actual: any) => {
                const budget = budgetsData.find(b => b.id === actual.budget);
                const header = headersData.find(h => h.id === budget?.header);
                
                const transaction = actual.trx && actual.trx !== "000000000000000000000000" 
                    ? transactionsData.find(t => t.id === actual.trx)
                    : undefined;
                
                const transactionInfo = transaction ? {
                    id: transaction.id,
                    name: transaction.name,
                    amount: transaction.amount,
                    projectName: projectsMap.get(transaction.project) || '',
                    project: transaction.project
                } : undefined;
                
                return {
                    ...actual,
                    headerName: header?.name || '',
                    headerId: header?.id || '',
                    headerOrder: header ? headersData.findIndex(h => h.id === header.id) : 0,
                    budgetType: budget?.type || 'expense',
                    transaction: transactionInfo,
                    assignedTo: actual.assignedTo || "000000000000000000000000",
                    assignedToName: actual.assignedTo && actual.assignedTo !== "000000000000000000000000" ? allUsers.find(u => String(u.id) === String(actual.assignedTo))?.name || "Unknown" : "—"
                };
            });

            const sortedActuals = actualsWithInfo.sort((a, b) => {
                if (a.headerOrder !== b.headerOrder) {
                    return a.headerOrder - b.headerOrder;
                }

                const budgetOrderA = headersData.find(h => h.id === a.headerId)?.arrBudget?.indexOf(a.budget) ?? 0;
                const budgetOrderB = headersData.find(h => h.id === b.headerId)?.arrBudget?.indexOf(b.budget) ?? 0;
                if (budgetOrderA !== budgetOrderB) {
                    return budgetOrderA - budgetOrderB;
                }

                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            // Use project's arrActual order if available
            if (projectDataRes?.arrActual && projectDataRes.arrActual.length > 0) {
                const actualsWithIndex = sortedActuals.map(a => ({
                    actual: a,
                    index: projectDataRes.arrActual.indexOf(a.id)
                }));
                actualsWithIndex.sort((a, b) => {
                    const indexA = a.index !== -1 ? a.index : Infinity;
                    const indexB = b.index !== -1 ? b.index : Infinity;
                    return indexA - indexB;
                });
                setActuals(actualsWithIndex.map(x => x.actual));
            } else {
                setActuals(sortedActuals);
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load actuals";
            toast.error(errorMessage);
            console.error("Error loading actuals:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredActuals = actuals
        .filter(actual => {
            const nameMatch = actual.name.toLowerCase().includes(searchNameTerm.toLowerCase());
            const tagMatch = searchTagTerm === '' || actual.tags.some((tag: string) => tag.toLowerCase().includes(searchTagTerm.toLowerCase()));
            const headerMatch = searchHeaderTerm === '' || actual.headerName.toLowerCase().includes(searchHeaderTerm.toLowerCase());
            const assignToMatch = assignToSearchTerm === '' || actual.assignedToName.toLowerCase().includes(assignToSearchTerm.toLowerCase());
            return nameMatch && tagMatch && headerMatch && assignToMatch;
        })
        .filter(actual => filterType === 'all' || actual.budgetType === filterType)
        .sort((a, b) => {
            if (sortByDate === 'none') {
                return 0;
            }
            const dateA = new Date(a.exDate).getTime();
            const dateB = new Date(b.exDate).getTime();
            return sortByDate === 'asc' ? dateA - dateB : dateB - dateA;
        });

    const selectedTotalAmount = Array.from(selectedActualIds).reduce((sum, id) => {
        const actual = actuals.find(a => a.id === id);
        const sign = actual?.budgetType === 'income' ? 1 : -1;
        return sum + (actual?.amount || 0) * sign;
    }, 0);

    const toggleSelectActual = (actualId: string) => {
        const newSet = new Set(selectedActualIds);
        newSet.has(actualId) ? newSet.delete(actualId) : newSet.add(actualId);
        setSelectedActualIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedActualIds.size === filteredActuals.length) {
            setSelectedActualIds(new Set<string>());
        } else {
            setSelectedActualIds(new Set(filteredActuals.map(a => a.id)));
        }
    };

    useEffect(() => {
        if (active) {
            loadData();
        }
    }, [projectId, active]);

    const loadUsers = async () => {
        if (allUsers.length > 0) return;
        setIsLoadingUsers(true);
        try {
            const res = await userApi.getAll();
            const users = Array.isArray(res.data) ? res.data : [];
            setAllUsers(users);
        } catch (error: any) {
            toast.error("Failed to load users");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleDeleteActual = async (actualId: string) => {
        const actual = actuals.find(a => a.id === actualId);
        if (actual && actual.transaction !== undefined) {
            toast.error("Cannot delete actual: a transaction is connected to it. Remove the transaction connection first.");
            return;
        }

        if (!window.confirm("Delete this actual item?")) {
            return;
        }

        try {
            await actualApi.delete(actualId);
            toast.success("Actual deleted successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete actual";
            toast.error(errorMessage);
        }
    };

    const openEditDialog = (actual: any) => {
        // Find the budget name
        const budget = budgets.find(b => b.id === actual.budget);
        const budgetName = budget?.name || '';
        
        // Find the transaction name
        const transactionName = actual.transaction ? actual.transaction.name : undefined;
        const hasTransaction = actual.transaction !== undefined;
        
        setEditActualForm({
            id: actual.id,
            name: actual.name,
            note: actual.note || '',
            amount: actual.amount,
            exDate: actual.exDate || new Date(),
            tags: (actual.tags || []).join(', '),
            assignedTo: actual.assignedTo || '',
            updatedAt: actual.updatedAt,
            updatedBy: actual.updatedBy
        });
        setEditActualBudgetName(budgetName);
        setEditActualTransactionName(transactionName);
        setEditActualHasTransaction(hasTransaction);
        setIsEditActualDialogOpen(true);
    };

    const handleNameClick = (actual: any) => {
        // Navigate to actual detail page
        navigate(`/actuals/${actual.id}`);
    };

    const handleDeleteSelected = async () => {
        if (selectedActualIds.size === 0) {
            toast.error("No actuals selected");
            return;
        }

        // Check if any selected actuals have transactions connected
        const actualsToDelete = Array.from(selectedActualIds).map(id => 
            actuals.find(a => a.id === id)
        ).filter(Boolean) as ActualWithBudgetInfo[];
        
        const actualsWithTransaction = actualsToDelete.filter(a => 
            a.transaction !== undefined
        );
        
        if (actualsWithTransaction.length > 0) {
            toast.error(`Cannot delete ${actualsWithTransaction.length} actual(s) because they have transactions connected. Remove the transaction connection first.`);
            return;
        }

        if (!window.confirm(`Delete ${selectedActualIds.size} selected actual item(s)?`)) {
            return;
        }

        try {
            await Promise.all(Array.from(selectedActualIds).map(id => actualApi.delete(id)));
            toast.success(`${selectedActualIds.size} actual(s) deleted successfully`);
            setSelectedActualIds(new Set<string>());
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete actuals";
            toast.error(errorMessage);
        }
    };

    const handleOpenRegisterToTransaction = async (actualId: string) => {
        setIsRegisterToTransactionModalOpen(true);
        setSelectedProjectId(null);
        setTransactionsForSelectedProject([]);
        setSelectedTransactionId(null);
        // Pre-select current project
        setSelectedProjectId(projectId);
        if (projectId) {
            await loadTransactionsForProject(projectId);
        }
    };

    const loadTransactionsForProject = async (projectId: string) => {
        setIsLoadingTransactions(true);
        try {
            // Get all transactions for the project
            const transactionsRes = await transactionApi.getAll({ project: projectId });
            const allTransactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
            
            const transactionsList = allTransactions.map((t: any) => ({ id: t._id || t.id, name: t.name }));
            
            setTransactionsForSelectedProject(transactionsList);
        } catch (error: any) {
            toast.error("Failed to load transactions");
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
        setTransactionsForSelectedProject([]);
        setSelectedTransactionId(null);
        loadTransactionsForProject(projectId);
    };

    const handleRegisterToTransaction = async (actualId: string) => {
        if (!selectedTransactionId) {
            toast.error("Please select a transaction");
            return;
        }

        try {
            await budgetApi.registerToTransaction({
                actualId: actualId,
                transactionId: selectedTransactionId,
            });

            toast.success("Actual registered to transaction successfully");
            setIsRegisterToTransactionModalOpen(false);
            setSelectedProjectId(null);
            setTransactionsForSelectedProject([]);
            setSelectedTransactionId(null);
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to register actual to transaction";
            toast.error(errorMessage);
        }
    };

    const handleAssignTo = async () => {
        if (selectedActualIds.size === 0) return;

        const user_ids = Array.from(selectedUsers);
        if (user_ids.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (!window.confirm(`Assign ${selectedActualIds.size} selected actual(s) to ${user_ids.length} user(s)?`)) {
            return;
        }

        try {
            await Promise.all(Array.from(selectedActualIds).map(actualId => 
                actualApi.update(actualId, { assignedTo: Array.from(selectedUsers)[0] })
            ));
            toast.success(`${selectedActualIds.size} actual(s) assigned successfully`);
            setSelectedActualIds(new Set<string>());
            setSelectedUsers(new Set<string>());
            setIsAssignToMenuOpen(false);
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to assign actuals";
            toast.error(errorMessage);
        }
    };

    const handleEditActual = async () => {
        try {
            const tagArray = parseTags(editActualForm.tags);
            await actualApi.update(editActualForm.id, {
                name: editActualForm.name.trim(),
                note: editActualForm.note,
                amount: editActualForm.amount,
                exDate: editActualForm.exDate,
                tags: tagArray,
                assignedTo: editActualForm.assignedTo
            });
            toast.success("Actual updated successfully");
            setIsEditActualDialogOpen(false);
            setEditActualForm({ id: '', name: '', note: '', amount: 0, exDate: new Date(), tags: '', assignedTo: '', updatedAt: new Date(), updatedBy: '' });
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update actual";
            toast.error(errorMessage);
        }
    };

    const handleActualDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeIndex = actuals.findIndex((a) => a.id === active.id);
        const overIndex = actuals.findIndex((a) => a.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        const newActuals = arrayMove(actuals, activeIndex, overIndex);
        setActuals(newActuals);

        // Save order to project
        try {
            const newOrder = newActuals.map(a => a.id);
            await api.put(`/project/${projectId}`, { arrActual: newOrder });
            // Update local state to reflect new order immediately
            setProjectData({ arrActual: newOrder });
        } catch (error: any) {
            console.error("Failed to save order:", error);
            toast.error("Failed to save order");
        }
    };

    const handleSavePosition = async () => {
        try {
            await api.put(`/project/${projectId}`, { arrActual: filteredActuals.map(a => a.id) });
            // Update local state to reflect new order immediately
            setProjectData({ arrActual: filteredActuals.map(a => a.id) });
            toast.success("Actual position saved successfully");
        } catch (error: any) {
            console.error("Failed to save position:", error);
            toast.error("Failed to save position");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(assignToSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(assignToSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        {selectedActualIds.size > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="destructive" className="h-8 px-2 text-xs">
                                        ({selectedActualIds.size}) sel
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDeleteSelected}>
                                        Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenRegisterToTransaction(Array.from(selectedActualIds)[0])} disabled={selectedActualIds.size !== 1}>
                                        Register to Transaction
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSavePosition}
                                title="Save actual positions"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
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
                                placeholder="Header"
                                value={searchHeaderTerm}
                                onChange={(e) => setSearchHeaderTerm(e.target.value)}
                                className="h-8 w-24"
                            />
                            <Input
                                placeholder="asgTo"
                                value={assignToSearchTerm}
                                onChange={(e) => setAssignToSearchTerm(e.target.value)}
                                className="h-8 w-24"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-2 py-1 h-8 cursor-pointer">
                                        Type: {filterType === 'all' ? 'All' : filterType === 'income' ? 'Inc' : 'Exp'}
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
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-2 py-1 h-8">
                                        Sort: {sortByDate === 'none' ? 'None' : sortByDate === 'asc' ? 'Oldest' : 'Newest'}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSortByDate('none')}>
                                        None (for drag-and-drop)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortByDate('asc')}>
                                        Date (Oldest)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSortByDate('desc')}>
                                        Date (Newest)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-medium">
                                Total: {formatNumber(selectedTotalAmount)}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DndContext onDragEnd={handleActualDragEnd}>
                        <SortableContext items={filteredActuals.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[5%] bg-cyan-50">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primary"
                                                checked={selectedActualIds.size > 0 && selectedActualIds.size === filteredActuals.length}
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
                                        <TableHead className="w-[25%] border-l-2 border-border bg-cyan-50">trxName</TableHead>
                                        <TableHead className="w-[10%] text-right bg-cyan-50">trxAmount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActuals.map((actual) => (
                                        <ActualSortableRow key={actual.id} id={actual.id} disabled={false}>
                                            <TableCell className="px-2 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 accent-primary"
                                                    checked={selectedActualIds.has(actual.id)}
                                                    onChange={() => toggleSelectActual(actual.id)}
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
                                                            handleNameClick(actual);
                                                        }}
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        {actual.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm py-3">
                                                {actual.tags && actual.tags.length > 0 ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {actual.tags.map((tag: string, idx: number) => (
                                                            <span key={idx} className="text-xs">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="w-[12%] text-sm text-muted-foreground py-3">
                                                {actual.headerName}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    actual.budgetType === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {getTypeLabel(actual.budgetType)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[12%] text-right py-3">
                                                <span className="text-xs font-medium">
                                                    {formatNumber(actual.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[6%] text-right text-sm text-muted-foreground py-3">
                                                {actual.exDate ? <span className="text-xs">{formatDate(actual.exDate)}</span> : '—'}
                                            </TableCell>
                                            <TableCell className="w-[9%] text-sm text-muted-foreground py-3">
                                                {actual.assignedToName !== "—" ? (
                                                    <span className="text-xs font-medium">{actual.assignedToName}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground border-l-2 border-border py-3">
                                                {actual.transaction ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-primary">{actual.transaction.name}</span>
                                                        <Link 
                                                            to={`/projects/${actual.transaction.project}?tab=actuals`}
                                                            className="text-xs italic text-muted-foreground hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {actual.transaction.projectName}
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-3">
                                                <span className="text-xs font-medium">
                                                    {actual.transaction ? formatNumber(actual.transaction.amount) : '-'}
                                                </span>
                                            </TableCell>
                                        </ActualSortableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </SortableContext>
                    </DndContext>

                    <ActualEditDialog
                        isOpen={isEditActualDialogOpen}
                        onOpenChange={setIsEditActualDialogOpen}
                        editActualForm={editActualForm}
                        setEditActualForm={setEditActualForm}
                        onEditActual={handleEditActual}
                        onDeleteActual={() => handleDeleteActual(editActualForm.id)}
                        budgetName={editActualBudgetName}
                        transactionName={editActualTransactionName}
                        hasTransaction={editActualHasTransaction}
                    />

                    {/* Register to Transaction Modal */}
                    <Dialog open={isRegisterToTransactionModalOpen} onOpenChange={setIsRegisterToTransactionModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Register to Transaction</DialogTitle>
                            </DialogHeader>
                            
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex gap-4 h-full">
                                    {/* Projects Column */}
                                    <div className="flex-1 border-r border-border">
                                        <div className="p-3 border-b">
                                            <h4 className="text-sm font-semibold">Projects</h4>
                                        </div>
                                        <div className="flex-1 overflow-auto p-2 space-y-1">
                                            {allProjects.map(project => (
                                                <div
                                                    key={project.id}
                                                    onClick={() => handleProjectSelect(project.id)}
                                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${selectedProjectId === project.id ? 'bg-accent font-medium' : ''}`}
                                                >
                                                    {project.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Transactions Column */}
                                    <div className="flex-1">
                                        <div className="p-3 border-b">
                                            <h4 className="text-sm font-semibold">Transactions</h4>
                                        </div>
                                        <div className="flex-1 overflow-auto p-2 space-y-1">
                                            {isLoadingTransactions ? (
                                                <div className="flex items-center justify-center h-32">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                            ) : transactionsForSelectedProject.length > 0 ? (
                                                transactionsForSelectedProject.map(transaction => (
                                                    <div
                                                        key={transaction.id}
                                                        onClick={() => setSelectedTransactionId(transaction.id)}
                                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent ${selectedTransactionId === transaction.id ? 'bg-accent font-medium' : ''}`}
                                                    >
                                                        {transaction.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                                                    No transactions found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsRegisterToTransactionModalOpen(false);
                                        setSelectedProjectId(null);
                                        setTransactionsForSelectedProject([]);
                                        setSelectedTransactionId(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={() => {
                                        if (selectedTransactionId) {
                                            handleRegisterToTransaction(Array.from(selectedActualIds)[0]);
                                        }
                                    }}
                                    disabled={!selectedTransactionId}
                                >
                                    Register
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {isAssignToMenuOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="bg-background rounded-lg shadow-lg w-[400px] max-h-[80vh] flex flex-col">
                                <div className="p-4 border-b">
                                    <h3 className="text-lg font-semibold">Assign to User</h3>
                                    <p className="text-sm text-muted-foreground">Select users for {selectedActualIds.size} actual(s)</p>
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
                                    {isLoadingUsers ? (
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ProjectActuals;
import { useState, useEffect } from "react";
import { headerApi, budgetApi, actualApi, userApi, api } from "@/services/api";
import { toast } from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlusIcon, SaveIcon } from "lucide-react";
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
import { formatNumber, getTypeLabel } from "@/utils/formatters";

interface ProjectActualsProps {
    projectId: string;
    active: boolean;
}

interface TransactionInfo {
    id: string;
    name: string;
    amount: number;
}

interface ActualWithBudgetInfo extends Actual {
    headerName: string;
    headerId: string;
    headerOrder: number;
    budgetType: 'income' | 'expense';
    transaction?: TransactionInfo;
    assignedTo: string;
    assignedToName: string;
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
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className={disabled ? '' : 'cursor-move'}>
            {children}
        </tr>
    );
}

export function ProjectActuals({ projectId, active }: ProjectActualsProps) {
    const [actuals, setActuals] = useState<ActualWithBudgetInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [editActualForm, setEditActualForm] = useState({
        id: '',
        name: '',
        amount: 0
    });
    const [selectedActualIds, setSelectedActualIds] = useState<Set<string>>(new Set<string>());
    const [isAssignToMenuOpen, setIsAssignToMenuOpen] = useState(false);
    const [assignToSearchTerm, setAssignToSearchTerm] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set<string>());
    const [projectData, setProjectData] = useState<{ arrActual: string[] } | null>(null);

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes, actualsRes, transactionsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId),
                actualApi.getAllByProject(projectId),
                api.get('/transaction')
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

            const headersData = Array.isArray(headersRes.data) ? headersRes.data : [];
            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
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

            const actualsWithInfo: ActualWithBudgetInfo[] = actualsData.map((actual: any) => {
                const budget = budgetsData.find(b => b.id === actual.budget);
                const header = headersData.find(h => h.id === budget?.header);
                
                const transaction = actual.trx && actual.trx !== "000000000000000000000000" 
                    ? transactionsData.find(t => t.id === actual.trx)
                    : undefined;
                
                return {
                    ...actual,
                    headerName: header?.name || '',
                    headerId: header?.id || '',
                    headerOrder: header ? headersData.findIndex(h => h.id === header.id) : 0,
                    budgetType: budget?.type || 'expense',
                    transaction: transaction ? {
                        id: transaction.id,
                        name: transaction.name,
                        amount: transaction.amount
                    } : undefined,
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

    const toggleSelectActual = (actualId: string) => {
        const newSet = new Set(selectedActualIds);
        newSet.has(actualId) ? newSet.delete(actualId) : newSet.add(actualId);
        setSelectedActualIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedActualIds.size === actuals.length) {
            setSelectedActualIds(new Set<string>());
        } else {
            setSelectedActualIds(new Set(actuals.map(a => a.id)));
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
        setEditActualForm({
            id: actual.id,
            name: actual.name,
            amount: actual.amount
        });
        setIsEditActualDialogOpen(true);
    };

    const handleDeleteSelected = async () => {
        if (selectedActualIds.size === 0) {
            toast.error("No actuals selected");
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

    const handleCloneToTransaction = async (actualId: string) => {
        const actual = actuals.find(a => a.id === actualId);
        if (!actual) return;

        const trxName = prompt("Enter transaction name:", actual.name);
        if (!trxName || !trxName.trim()) {
            return;
        }

        try {
            await budgetApi.cloneToTransaction({
                actualId: actualId,
                trxName: trxName.trim(),
            });
            toast.success("Transaction created successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to create transaction";
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
            await actualApi.update(editActualForm.id, {
                name: editActualForm.name.trim(),
                amount: editActualForm.amount
            });
            toast.success("Actual updated successfully");
            setIsEditActualDialogOpen(false);
            setEditActualForm({ id: '', name: '', amount: 0 });
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
            await api.put(`/project/${projectId}`, { arrActual: actuals.map(a => a.id) });
            // Update local state to reflect new order immediately
            setProjectData({ arrActual: actuals.map(a => a.id) });
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
                                    <Button variant="destructive">
                                        ({selectedActualIds.size}) selected
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleDeleteSelected}>
                                        Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCloneToTransaction(Array.from(selectedActualIds)[0])} disabled={selectedActualIds.size !== 1}>
                                        Clone to Transaction
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
                        <Button onClick={handleSavePosition} variant="outline" size="sm" className="gap-2">
                            <SaveIcon className="w-4 h-4" />
                            <span>Save Position</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <DndContext onDragEnd={handleActualDragEnd}>
                        <SortableContext items={actuals.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[5%]">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-primary"
                                                checked={selectedActualIds.size > 0 && selectedActualIds.size === actuals.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[25%]">Name</TableHead>
                                        <TableHead className="w-[7%] text-center">t</TableHead>
                                        <TableHead className="w-[15%]">Header</TableHead>
                                        <TableHead className="w-[15%] text-right">Amount</TableHead>
                                        <TableHead className="w-[8%]">asgTo</TableHead>
                                        <TableHead className="w-[22%] border-l-2 border-border">trxName</TableHead>
                                        <TableHead className="w-[8%] text-right">trxAmount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actuals.map((actual) => (
                                        <ActualSortableRow key={actual.id} id={actual.id} disabled={false}>
                                            <TableCell className="px-2">
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
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="cursor-pointer hover:underline font-medium"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(actual);
                                                        }}
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        {actual.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    actual.budgetType === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {getTypeLabel(actual.budgetType)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {actual.headerName}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-medium">
                                                    {formatNumber(actual.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {actual.assignedToName !== "—" ? (
                                                    <span className="text-xs font-medium">{actual.assignedToName}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground border-l-2 border-border">
                                                {actual.transaction ? (
                                                    <span className="font-medium text-primary">{actual.transaction.name}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-medium">
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
                    />

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
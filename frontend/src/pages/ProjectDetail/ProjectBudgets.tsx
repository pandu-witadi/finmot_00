import { useState, useEffect } from "react";
import { headerApi, budgetApi, projectApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { HeaderAddDialog } from "./HeaderAddDialog";
import { BudgetAddDialog } from "./BudgetAddDialog";
import { HeaderEditDialog } from "./HeaderEditDialog";
import { BudgetEditDialog } from "./BudgetEditDialog";
import { ActualEditDialog } from "./ActualEditDialog";
import { Header } from "./useBudgetHeaders";
import { Budget } from "./useBudgets";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { actualApi } from "@/services/api";
import { formatNumber, getTypeLabel, parseTags } from "@/utils/formatters";

interface ProjectBudgetsProps {
    projectId: string;
}

// Header Sortable Item
function HeaderSortableItem({ id, children, isExpanded }: { id: string; children: React.ReactNode; isExpanded: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id,
        disabled: isExpanded,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isExpanded ? '' : 'cursor-move'}>
            {children}
        </div>
    );
}

// Budget Row Sortable Item
function BudgetSortableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
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

export function ProjectBudgets({ projectId }: ProjectBudgetsProps) {
    const [headers, setHeaders] = useState<Header[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddHeaderDialogOpen, setIsAddHeaderDialogOpen] = useState(false);
    const [isEditHeaderDialogOpen, setIsEditHeaderDialogOpen] = useState(false);
    const [isAddBudgetDialogOpen, setIsAddBudgetDialogOpen] = useState(false);
    const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
    const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);

    const [headerForm, setHeaderForm] = useState({
        name: '',
        type: 'expense' as 'income' | 'expense',
        tags: ''
    });

    const [editHeaderForm, setEditHeaderForm] = useState({
        id: '',
        name: '',
        type: 'expense' as 'income' | 'expense',
        tags: ''
    });

    const [editBudgetForm, setEditBudgetForm] = useState({
        id: '',
        name: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: ''
    });

    const [budgetForm, setBudgetForm] = useState({
        name: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: ''
    });

    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set<string>());
    const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set<string>());
    const [isCloneConfirmOpen, setIsCloneConfirmOpen] = useState(false);
    const [clonedBudgets, setClonedBudgets] = useState<{budget: Budget, name: string}[]>([]);
    const [actuals, setActuals] = useState<{[budgetId: string]: {id: string, name: string, amount: number}[]}>({});
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [editActualForm, setEditActualForm] = useState({
        id: '',
        name: '',
        amount: 0
    });

    const toggleSelectBudget = (budgetId: string) => {
        const newSet = new Set(selectedBudgetIds);
        newSet.has(budgetId) ? newSet.delete(budgetId) : newSet.add(budgetId);
        setSelectedBudgetIds(newSet);
    };

    const toggleSelectAllBudgets = (budgets: {id: string}[]) => {
        const allSelected = budgets.length > 0 && budgets.every(b => selectedBudgetIds.has(b.id));
        const newSet = new Set(selectedBudgetIds);
        budgets.forEach(b => {
            allSelected ? newSet.delete(b.id) : newSet.add(b.id);
        });
        setSelectedBudgetIds(newSet);
    };

    const openCloneConfirm = () => {
        const budgetsToClone = budgets.filter(b => selectedBudgetIds.has(b.id));
        const budgetsWithNames = budgetsToClone.map(b => ({
            budget: b,
            name: b.name
        }));
        setClonedBudgets(budgetsWithNames);
        setIsCloneConfirmOpen(true);
    };

    const handleCloneConfirm = async () => {
        try {
            const clonePromises = clonedBudgets.map(async (item) => {
                const budget = budgets.find(b => b.id === item.budget.id);
                if (!budget) return null;
                
                await budgetApi.clone({
                    budgetId: budget.id,
                    actualName: item.name,
                });
                
                return budget;
            });
            
            const cloned = await Promise.all(clonePromises);
            const count = cloned.filter(b => b !== null).length;
            toast.success(`Successfully cloned ${count} budget${count !== 1 ? 's' : ''}`);
            
            setIsCloneConfirmOpen(false);
            setClonedBudgets([]);
            setSelectedBudgetIds(new Set<string>());
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to clone budgets";
            toast.error(errorMessage);
        }
    };

    // Load data on initial mount and when projectId changes
    useEffect(() => {
        loadData();
    }, [projectId]);

    // Helper: Show confirmation dialog
    const showConfirm = (message: string) => window.confirm(message);

    // Helper: Handle delete operation with toast feedback
    const handleDeleteOperation = async (
        deleteFn: () => Promise<any>,
        successMessage: string,
        errorMessage: string
    ) => {
        if (!showConfirm("Are you sure?")) return;
        
        try {
            await deleteFn();
            toast.success(successMessage);
            await loadData();
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    // Helper: Show success toast with data reload
    const showSuccessWithReload = async (message: string) => {
        toast.success(message);
        await loadData();
    };

    // Helper: Handle save operation with confirm dialog
    const handleSaveOperation = async (
        saveFn: () => Promise<any>,
        confirmMessage: string,
        successMessage: string,
        errorMessage: string
    ) => {
        if (!showConfirm(confirmMessage)) return;
        
        try {
            await saveFn();
            await showSuccessWithReload(successMessage);
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    // Helper: Handle create operation with toast feedback
    const handleCreateOperation = async (
        createFn: (data: any) => Promise<any>,
        data: any,
        successMessage: string,
        errorMessage: string
    ) => {
        try {
            await createFn(data);
            toast.success(successMessage);
            await showSuccessWithReload("");
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    // Helper: Handle update operation with toast feedback
    const handleUpdateOperation = async (
        updateFn: (id: string, data: any) => Promise<any>,
        id: string,
        data: any,
        successMessage: string,
        errorMessage: string
    ) => {
        try {
            await updateFn(id, data);
            toast.success(successMessage);
            await showSuccessWithReload("");
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    // Expand all headers by default
    useEffect(() => {
        if (headers.length > 0) {
            setExpandedHeaders(new Set(headers.map((h) => h.id)));
        }
    }, [headers]);

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes, actualsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId),
                actualApi.getAllByProject(projectId)
            ]);
            const headers = Array.isArray(headersRes.data) ? headersRes.data : [];
            setHeaders(headers);
            
            // Sort budgets according to each header's arrBudget order
            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            const sortedBudgets = budgetsData.sort((a, b) => {
                const headerA = headers.find(h => h.id === a.header);
                const headerB = headers.find(h => h.id === b.header);
                if (!headerA || !headerB) return 0;
                const arrA = headerA.arrBudget || [];
                const arrB = headerB.arrBudget || [];
                const indexA = arrA.indexOf(a.id);
                const indexB = arrB.indexOf(b.id);
                return indexA - indexB;
            });
            setBudgets(sortedBudgets);
            
            // Group actuals by budget ID
            const actualsData = Array.isArray(actualsRes.data) ? actualsRes.data : [];
            const actualsMap: {[budgetId: string]: {id: string, name: string, amount: number}[]} = {};
            actualsData.forEach((actual: any) => {
                if (actual.budget) {
                    if (!actualsMap[actual.budget]) {
                        actualsMap[actual.budget] = [];
                    }
                    actualsMap[actual.budget].push({
                        id: actual.id,
                        name: actual.name,
                        amount: actual.amount
                    });
                }
            });
            setActuals(actualsMap);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load budgets";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddHeader = async () => {
        if (!headerForm.name.trim()) {
            toast.error("Header name is required");
            return;
        }

        await handleCreateOperation(
            headerApi.create,
            {
                name: headerForm.name.trim(),
                type: headerForm.type,
                tags: parseTags(headerForm.tags),
                project: projectId,
                active: true
            },
            "Header added successfully",
            "Failed to add header"
        );
    };

    const handleAddBudget = async () => {
        if (!budgetForm.name.trim()) {
            toast.error("Budget name is required");
            return;
        }

        if (!selectedHeaderId) {
            toast.error("Please select a header first");
            return;
        }

        await handleCreateOperation(
            budgetApi.create,
            {
                name: budgetForm.name.trim(),
                type: budgetForm.type,
                amount: budgetForm.amount,
                tags: parseTags(budgetForm.tags),
                project: projectId,
                header: selectedHeaderId,
                active: true
            },
            "Budget added successfully",
            "Failed to add budget"
        );
    };

    const handleDeleteHeader = async (id: string) => {
        const header = headers.find(h => h.id === id);
        if (!header) {
            toast.error("Header not found");
            return;
        }

        const arrBudget = Array.isArray(header.arrBudget) ? header.arrBudget : [];
        
        if (arrBudget.length > 0) {
            toast.error(`Cannot delete header. There are ${arrBudget.length} budgets still associated with this header. Please remove budgets first.`);
            return;
        }
        
        const budgetsUnderHeader = budgets.filter(b => b.header === id);
        
        if (budgetsUnderHeader.length > 0) {
            toast.error(`Cannot delete header. ${budgetsUnderHeader.length} budgets still reference this header. Please remove them first.`);
            return;
        }
        
        await handleDeleteOperation(
            async () => await headerApi.delete(id),
            "Header deleted successfully",
            "Failed to delete header"
        );
    };

    const openEditHeader = (header: Header) => {
        setEditHeaderForm({
            id: header.id,
            name: header.name,
            type: header.type,
            tags: header.tags.join(', ')
        });
        setIsEditHeaderDialogOpen(true);
    };

    const handleEditHeader = async () => {
        const tagArray = parseTags(editHeaderForm.tags);
        await handleUpdateOperation(
            headerApi.update,
            editHeaderForm.id,
            {
                name: editHeaderForm.name.trim(),
                type: editHeaderForm.type,
                tags: tagArray
            },
            "Header updated successfully",
            "Failed to update header"
        );
        setIsEditHeaderDialogOpen(false);
        setEditHeaderForm({ id: '', name: '', type: 'expense', tags: '' });
    };

    const openEditBudget = (budget: Budget) => {
        setEditBudgetForm({
            id: budget.id,
            name: budget.name,
            type: budget.type,
            amount: budget.amount,
            tags: budget.tags.join(', ')
        });
        setIsEditBudgetDialogOpen(true);
    };

    const handleDeleteBudget = async (budgetId: string) => {
        await handleDeleteOperation(
            async () => await budgetApi.delete(budgetId),
            "Budget deleted successfully",
            "Failed to delete budget"
        );
    };

    const handleEditBudget = async () => {
        const tagArray = parseTags(editBudgetForm.tags);
        await handleUpdateOperation(
            budgetApi.update,
            editBudgetForm.id,
            {
                name: editBudgetForm.name.trim(),
                type: editBudgetForm.type,
                amount: editBudgetForm.amount,
                tags: tagArray
            },
            "Budget updated successfully",
            "Failed to update budget"
        );
        setIsEditBudgetDialogOpen(false);
        setEditBudgetForm({ id: '', name: '', type: 'expense', amount: 0, tags: '' });
    };

    const openEditActual = (actual: {id: string, name: string, amount: number}) => {
        setEditActualForm({
            id: actual.id,
            name: actual.name,
            amount: actual.amount
        });
        setIsEditActualDialogOpen(true);
    };

    const handleDeleteActual = async (actualId: string) => {
        await handleDeleteOperation(
            async () => await actualApi.delete(actualId),
            "Actual deleted successfully",
            "Failed to delete actual"
        );
    };

    const handleEditActual = async () => {
        await handleUpdateOperation(
            actualApi.update,
            editActualForm.id,
            {
                name: editActualForm.name.trim(),
                amount: editActualForm.amount
            },
            "Actual updated successfully",
            "Failed to update actual"
        );
        setIsEditActualDialogOpen(false);
        setEditActualForm({ id: '', name: '', amount: 0 });
    };

    // Header drag/drop handlers with dnd-kit
    const handleHeaderDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeHeaderIndex = headers.findIndex((h) => h.id === active.id);
        const overHeaderIndex = headers.findIndex((h) => h.id === over.id);

        if (activeHeaderIndex === -1 || overHeaderIndex === -1) {
            return;
        }

        setHeaders((prev) => {
            const newHeaders = arrayMove(prev, activeHeaderIndex, overHeaderIndex);
            return newHeaders;
        });
    };

    // Budget drag/drop handlers with dnd-kit
    const handleBudgetDragEnd = (event: DragEndEvent, headerId: string) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const associatedBudgets = budgets.filter((b) => b.header === headerId);
        const activeBudgetIndex = associatedBudgets.findIndex((b) => b.id === active.id);
        const overBudgetIndex = associatedBudgets.findIndex((b) => b.id === over.id);

        if (activeBudgetIndex === -1 || overBudgetIndex === -1) {
            return;
        }

        setBudgets((prev) => {
            const newBudgets = [...prev];
            const headerBudgets = newBudgets.filter((b) => b.header === headerId);
            const movedBudgets = arrayMove(headerBudgets, activeBudgetIndex, overBudgetIndex);

            // Replace the header's budgets in the main array
            const otherBudgets = newBudgets.filter((b) => b.header !== headerId);
            return [...otherBudgets, ...movedBudgets];
        });
    };

    const handleSaveHeaderPositions = async () => {
        const projectHeaderOrder = headers.map(h => h.id);
        await handleSaveOperation(
            async () => await projectApi.update(projectId, { arrHeader: projectHeaderOrder }),
            "Save header positions?",
            "Header positions saved successfully",
            "Failed to save header positions"
        );
    };

    const handleSaveBudgetPositions = async (headerId: string) => {
        const header = headers.find(h => h.id === headerId);
        if (!header) {
            toast.error("Header not found");
            return;
        }

        const associatedBudgets = budgets.filter(b => b.header === headerId);
        if (associatedBudgets.length === 0) {
            toast.success("No budgets to save");
            return;
        }

        const budgetIds = associatedBudgets.map(b => b.id);
        await handleSaveOperation(
            async () => await headerApi.update(headerId, { arrBudget: budgetIds }),
            `Save positions for ${header.name}? This will update the order of ${associatedBudgets.length} budgets.`,
            "Budget positions saved successfully",
            "Failed to save budget positions"
        );
    };

    const getHeaderTotal = (header: Header) => {
        const headerBudgets = budgets.filter(b => b.header === header.id);
        return headerBudgets.reduce((sum, b) => sum + (b.type === 'income' ? b.amount : -b.amount), 0);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button onClick={() => setIsAddHeaderDialogOpen(true)}>
                        Add Header
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSaveHeaderPositions}
                        title="Save Header Positions"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <path d="M17 21v-8H7v8" />
                            <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                        </svg>
                    </Button>
                </div>
            </div>

            {/* DndContext for headers - wrapping the grid */}
            <DndContext onDragEnd={handleHeaderDragEnd}>
                <div className="grid gap-4">
                    <SortableContext items={headers.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                        {headers.map((header) => {
                            const associatedBudgets = budgets.filter(b => b.header === header.id);
                            const headerTotal = getHeaderTotal(header);

                            return (
                                <HeaderSortableItem key={header.id} id={header.id} isExpanded={expandedHeaders.has(header.id)}>
                                    <Card
                                        className={`transition-all`}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <div
                                                className={`cursor-move space-y-1 ${!expandedHeaders.has(header.id) ? 'cursor-grab' : 'cursor-not-allowed'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="text-muted-foreground hover:text-foreground pointer-events-auto"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newExpanded = new Set(expandedHeaders);
                                                            if (newExpanded.has(header.id)) {
                                                                newExpanded.delete(header.id);
                                                            } else {
                                                                newExpanded.add(header.id);
                                                            }
                                                            setExpandedHeaders(newExpanded);
                                                        }}
                                                    >
                                                        {expandedHeaders.has(header.id) ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                                                                <path d="m18 15-6-6-6 6" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                                                                <path d="m6 9 6 6 6-6" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-lg font-bold text-primary hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditHeader(header);
                                                        }}
                                                    >
                                                        {header.name}
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                        header.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {getTypeLabel(header.type)}
                                                    </span>
                                                    <span>{formatNumber(headerTotal)}</span>
                                                    {associatedBudgets.length > 0 && Array.from(selectedBudgetIds).some(id => associatedBudgets.some(b => b.id === id)) && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id)).length} selected
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {associatedBudgets.length > 0 && Array.from(selectedBudgetIds).some(id => associatedBudgets.some(b => b.id === id)) && (
                                                    (() => {
                                                        const selectedCount = Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id)).length;
                                                        const selectedBudgets = budgets.filter(b => selectedBudgetIds.has(b.id));
                                                        const hasDelete = selectedBudgets.some(b => b.active);
                                                        return (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button size="sm" type="button" className="h-8 px-3" onClick={(e) => {
                                                                        e.stopPropagation();
                                                                    }}>
                                                                        {selectedCount} selected
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {selectedCount === 1 && (
                                                                        <DropdownMenuItem onClick={openCloneConfirm}>
                                                                            Clone
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {hasDelete && (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            const selectedInHeader = Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id));
                                                                            toast.success("Delete action would delete " + selectedInHeader.length + " budgets in this header");
                                                                        }}>
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        );
                                                    })()
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedHeaderId(header.id); setIsAddBudgetDialogOpen(true); }}
                                                    title="Add budget"
                                                >
                                                    +
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleSaveBudgetPositions(header.id); }}
                                                    title="Save budget positions"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save">
                                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                        <path d="M17 21v-8H7v8" />
                                                        <path d="M7 10V3a1 1 0 0 1 1-1h5v7" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHeader(header.id); }}
                                                    title="Delete header"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className={!expandedHeaders.has(header.id) ? 'p-0' : ''}>
                                            {!expandedHeaders.has(header.id) ? (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    Click chevron to show budgets
                                                </div>
                                            ) : (
                                                <>
                                                    {/* DndContext for budgets within each header */}
                                                    <DndContext onDragEnd={(event) => handleBudgetDragEnd(event, header.id)}>
                                                        <Table className="table-fixed">
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="w-10 px-2 text-left">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="h-4 w-4 accent-primary"
                                                                            checked={associatedBudgets.length > 0 && associatedBudgets.every(b => selectedBudgetIds.has(b.id))}
                                                                            onPointerDown={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleSelectAllBudgets(associatedBudgets);
                                                                            }}
                                                                            onChange={() => {}}
                                                                        />
                                                                    </TableHead>
                                                                    <TableHead className="w-[50%] px-2 text-left border-b border-gray-200">Name</TableHead>
                                                                    <TableHead className="w-[12.5%] px-2 text-center border-b border-gray-200">t</TableHead>
                                                                    <TableHead className="text-right w-[12.5%] border-b border-gray-200">Amount</TableHead>
                                                                    <TableHead className="text-left w-[40%]">actName</TableHead>
                                                                    <TableHead className="text-right w-[20%]">actAmount</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <SortableContext items={associatedBudgets.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                                                <TableBody>
                                                                    {associatedBudgets.flatMap((budget) => {
                                                                        const budgetActuals = actuals[budget.id] || [];
                                                                        if (budgetActuals.length === 0) {
                                                                            return (
                                                                                <BudgetSortableRow key={budget.id} id={budget.id} disabled={false}>
                                                                                    <TableCell className="px-2 text-left">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            className="h-4 w-4 accent-primary"
                                                                                            checked={selectedBudgetIds.has(budget.id)}
                                                                                            onPointerDown={(e) => {
                                                                                                e.stopPropagation();
                                                                                                toggleSelectBudget(budget.id);
                                                                                            }}
                                                                                            onChange={() => {}}
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[50%] px-2 text-left border-b border-gray-200">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span
                                                                                                className="cursor-pointer hover:underline font-medium"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    openEditBudget(budget);
                                                                                                }}
                                                                                                onPointerDown={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                }}
                                                                                            >
                                                                                                {budget.name}
                                                                                            </span>
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[12.5%] px-2 text-center border-b border-gray-200">
                                                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                                                            budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                                        }`}>
                                                                                            {getTypeLabel(budget.type)}
                                                                                        </span>
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[12.5%] text-right border-b border-gray-200">
                                                                                        <span className="text-sm">
                                                                                            {formatNumber(budget.amount)}
                                                                                        </span>
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[40%] text-left border-b border-gray-200">
                                                                                        <span className="text-sm text-muted-foreground">—</span>
                                                                                    </TableCell>
                                                                                    <TableCell className="w-[20%] text-right border-b border-gray-200">
                                                                                        <span className="text-sm text-muted-foreground">—</span>
                                                                                    </TableCell>
                                                                                </BudgetSortableRow>
                                                                            );
                                                                        }
                                                                        return budgetActuals.map((actual, index) => {
                                                                            const isDraggable = index === 0;
                                                                            const rowKey = index === 0 ? budget.id : actual.id;
                                                                            return (
                                                                                <BudgetSortableRow key={rowKey} id={rowKey} disabled={!isDraggable}>
                                                                                    {index === 0 && (
                                                                                        <>
                                                                                            <TableCell rowSpan={budgetActuals.length} className="px-2 text-left">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    className="h-4 w-4 accent-primary"
                                                                                                    checked={selectedBudgetIds.has(budget.id)}
                                                                                                    onPointerDown={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        toggleSelectBudget(budget.id);
                                                                                                    }}
                                                                                                    onChange={() => {}}
                                                                                                />
                                                                                            </TableCell>
                                                                                            <TableCell rowSpan={budgetActuals.length} className="w-[50%] px-2 text-left border-b border-gray-200">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span
                                                                                                        className="cursor-pointer hover:underline font-medium"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            openEditBudget(budget);
                                                                                                        }}
                                                                                                        onPointerDown={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                        }}
                                                                                                    >
                                                                                                        {budget.name}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell rowSpan={budgetActuals.length} className="w-[12.5%] px-2 text-center border-b border-gray-200">
                                                                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                                                                    budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                                                }`}>
                                                                                                    {getTypeLabel(budget.type)}
                                                                                                </span>
                                                                                            </TableCell>
                                                                                            <TableCell rowSpan={budgetActuals.length} className="w-[12.5%] text-right border-b border-gray-200">
                                                                                                <span className="text-sm">
                                                                                                    {formatNumber(budget.amount)}
                                                                                                </span>
                                                                                            </TableCell>
                                                                                        </>
                                                                                    )}
                                                                                    <TableCell className={`w-[40%] text-left ${index === budgetActuals.length - 1 ? "border-b border-gray-200" : ""}`}>
                                                                                        <span 
                                                                                            className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground hover:underline cursor-pointer" 
                                                                                            title={actual.name}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                openEditActual(actual);
                                                                                            }}
                                                                                            onPointerDown={(e) => {
                                                                                                e.stopPropagation();
                                                                                            }}
                                                                                        >
                                                                                            {actual.name}
                                                                                        </span>
                                                                                    </TableCell>
                                                                                    <TableCell className={`w-[20%] text-right ${index === budgetActuals.length - 1 ? "border-b border-gray-200" : ""}`}>
                                                                                        <span className="text-sm text-muted-foreground">
                                                                                            {formatNumber(actual.amount)}
                                                                                        </span>
                                                                                    </TableCell>
                                                                                </BudgetSortableRow>
                                                                            );
                                                                        });
                                                                        })}
                                                                </TableBody>
                                                            </SortableContext>
                                                        </Table>
                                                    </DndContext>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </HeaderSortableItem>
                            );
                        })}
                    </SortableContext>
                </div>
            </DndContext>

            <HeaderAddDialog
                isOpen={isAddHeaderDialogOpen}
                onOpenChange={setIsAddHeaderDialogOpen}
                headerForm={headerForm}
                setHeaderForm={setHeaderForm}
                onAddHeader={handleAddHeader}
            />

            <BudgetAddDialog
                isOpen={isAddBudgetDialogOpen}
                onOpenChange={setIsAddBudgetDialogOpen}
                headers={headers}
                selectedHeaderId={selectedHeaderId}
                budgetForm={budgetForm}
                setBudgetForm={setBudgetForm}
                onSelectHeader={setSelectedHeaderId}
                onAddBudget={handleAddBudget}
            />

            <HeaderEditDialog
                isOpen={isEditHeaderDialogOpen}
                onOpenChange={setIsEditHeaderDialogOpen}
                editHeaderForm={editHeaderForm}
                setEditHeaderForm={setEditHeaderForm}
                onEditHeader={handleEditHeader}
            />

            <BudgetEditDialog
                isOpen={isEditBudgetDialogOpen}
                onOpenChange={setIsEditBudgetDialogOpen}
                editBudgetForm={editBudgetForm}
                setEditBudgetForm={setEditBudgetForm}
                onEditBudget={handleEditBudget}
                onDeleteBudget={() => handleDeleteBudget(editBudgetForm.id)}
                hasActuals={!!actuals[editBudgetForm.id] && actuals[editBudgetForm.id].length > 0}
            />

            <ActualEditDialog
                isOpen={isEditActualDialogOpen}
                onOpenChange={setIsEditActualDialogOpen}
                editActualForm={editActualForm}
                setEditActualForm={setEditActualForm}
                onEditActual={handleEditActual}
                onDeleteActual={() => handleDeleteActual(editActualForm.id)}
            />

            <Dialog open={isCloneConfirmOpen} onOpenChange={setIsCloneConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clone Budget to Actual</DialogTitle>
                        <DialogDescription>
                            This will create Actual records for {clonedBudgets.length} selected budget(s). Each Actual will copy the name, type, amount, and tags from the Budget.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            {clonedBudgets.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {item.budget.type === 'income' ? 'Income' : 'Expense'} - {formatNumber(item.budget.amount)}
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <path d="m12 3 1.912 5.513a2 2 0 0 0 2.549 1.532l5.508-.918a2 2 0 0 1 2.49 2.49l-.918 5.508a2 2 0 0 0 1.532 2.549l5.513 1.912a2 2 0 0 1 0 3.824l-5.513 1.912a2 2 0 0 0-1.532 2.549l.918 5.508a2 2 0 0 1-2.49 2.49l-5.508-.918a2 2 0 0 0-2.549 1.532l-1.912 5.513a2 2 0 0 1-3.824 0l-1.912-5.513a2 2 0 0 0-2.549-1.532l-5.508.918a2 2 0 0 1-2.49-2.49l.918-5.508a2 2 0 0 0-1.532-2.549l-5.513-1.912a2 2 0 0 1 0-3.824l5.513-1.912a2 2 0 0 0 1.532-2.549l-.918-5.508a2 2 0 0 1 2.49-2.49l5.508.918a2 2 0 0 0 2.549-1.532L12 3Z"/>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCloneConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCloneConfirm}>
                            Clone {clonedBudgets.length} budget{clonedBudgets.length !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ProjectBudgets;


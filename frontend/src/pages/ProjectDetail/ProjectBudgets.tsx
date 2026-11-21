import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { headerApi, budgetApi, projectApi, actualApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { HeaderAddDialog } from "./HeaderAddDialog";
import { BudgetAddDialog } from "./BudgetAddDialog";
import { HeaderEditDialog } from "./HeaderEditDialog";
import { BudgetEditDialog } from "./BudgetEditDialog";
import { ActualEditDialog } from "./ActualEditDialog";
import { ActualRegisterDialog } from "./ActualRegisterDialog";
import { Header } from "./useBudgetHeaders";
import { Budget } from "./useBudgets";
import { EditBudgetForm, BudgetForm, EditActualForm } from "./types";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatNumber, getTypeLabel, parseTags } from "@/utils/formatters";
import { formatDate } from "@/utils/dateFormatters";
import { CheckSquare, Square } from "lucide-react";

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
    const navigate = useNavigate();
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

    const [editBudgetForm, setEditBudgetForm] = useState<EditBudgetForm>({
        id: '',
        name: '',
        note: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: '',
        updatedAt: new Date(),
        updatedBy: ''
    });

    const [budgetForm, setBudgetForm] = useState<BudgetForm>({
        name: '',
        note: '',
        type: 'expense' as 'income' | 'expense',
        amount: 0,
        tags: ''
    });

    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set<string>());
    const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set<string>());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [budgetsToDelete, setBudgetsToDelete] = useState<string[]>([]);
    const [isRegisterMultipleConfirmOpen, setIsRegisterMultipleConfirmOpen] = useState(false);
    const [budgetsToRegister, setBudgetsToRegister] = useState<Budget[]>([]);
    const [multipleExDate, setMultipleExDate] = useState<Date>(new Date());
    const [isRegisterActualDialogOpen, setIsRegisterActualDialogOpen] = useState(false);
    const [budgetToRegister, setBudgetToRegister] = useState<Budget | null>(null);
    const [actuals, setActuals] = useState<{[budgetId: string]: {id: string, name: string, amount: number, exDate: Date}[]}>({});
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [editActualForm, setEditActualForm] = useState<EditActualForm>({
        id: '',
        name: '',
        amount: 0,
        exDate: new Date(),
        tags: [],
        assignedTo: '',
        updatedAt: new Date(),
        updatedBy: ''
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

    const openRegisterActual = () => {
        const budgetsToRegister = budgets.filter(b => selectedBudgetIds.has(b.id));
        
        if (budgetsToRegister.length === 1) {
            const budget = budgetsToRegister[0];
            setBudgetToRegister(budget);
            setIsRegisterActualDialogOpen(true);
        } else {
            // For multiple budgets, open confirmation dialog with exDate field
            setBudgetsToRegister(budgetsToRegister);
            setIsRegisterMultipleConfirmOpen(true);
        }
    };

    const handleRegisterMultipleBudgets = async (budgetsToRegister: Budget[], exDate: Date) => {
        try {
            const registerPromises = budgetsToRegister.map(async (budget) => {
                return await budgetApi.registerActual({
                    budgetId: budget.id,
                    actualName: budget.name,
                    updatedBy: 'user123',
                    exDate: exDate
                });
            });
            
            const actualsCreated = await Promise.all(registerPromises);
            toast.success(`Successfully registered ${actualsCreated.length} actuals`);
            
            setIsRegisterMultipleConfirmOpen(false);
            setBudgetsToRegister([]);
            setSelectedBudgetIds(new Set<string>());
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to register budgets";
            toast.error(errorMessage);
        }
    };

    const handleDeleteSelectedBudgets = async () => {
        try {
            // Filter out budgets that have actuals
            const budgetsWithActuals = budgetsToDelete.filter(budgetId => {
                const budget = budgets.find(b => b.id === budgetId);
                return budget && actuals[budgetId] && actuals[budgetId].length > 0;
            });
            
            if (budgetsWithActuals.length > 0) {
                const budgetNames = budgetsWithActuals.map(budgetId => {
                    const budget = budgets.find(b => b.id === budgetId);
                    return budget?.name || budgetId;
                });
                toast.error(`Cannot delete ${budgetsWithActuals.length} budget(s) with actuals: ${budgetNames.join(', ')}`);
                return;
            }
            
            const deletePromises = budgetsToDelete.map(async (budgetId) => {
                await budgetApi.delete(budgetId);
            });
            
            await Promise.all(deletePromises);
            toast.success(`Successfully deleted ${budgetsToDelete.length} budget${budgetsToDelete.length !== 1 ? 's' : ''}`);
            
            setIsDeleteConfirmOpen(false);
            setBudgetsToDelete([]);
            setSelectedBudgetIds(new Set<string>());
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete budgets";
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    const showConfirm = (message: string) => window.confirm(message);

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

    const handleSaveOperation = async (
        saveFn: () => Promise<any>,
        confirmMessage: string,
        successMessage: string,
        errorMessage: string
    ) => {
        if (!showConfirm(confirmMessage)) return;
        
        try {
            await saveFn();
            toast.success(successMessage);
            await loadData();
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    const handleCreateOperation = async (
        createFn: (data: any) => Promise<any>,
        data: any,
        successMessage: string,
        errorMessage: string
    ) => {
        try {
            await createFn(data);
            toast.success(successMessage);
            await loadData();
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

    const resetHeaderForm = () => setEditHeaderForm({ id: '', name: '', type: 'expense', tags: '' });
    const resetBudgetForm = () => setEditBudgetForm({ id: '', name: '', note: '', type: 'expense', amount: 0, tags: '', done: false, updatedAt: new Date(), updatedBy: '' });
    const resetActualForm = () => setEditActualForm({ id: '', name: '', amount: 0, exDate: new Date(), tags: [], assignedTo: '', updatedAt: new Date(), updatedBy: '' });

    const handleRegisterActual = async (data: {
        budgetId: string;
        actualName: string;
        exDate: Date;
        updatedBy: string;
    }) => {
        try {
            await budgetApi.registerActual({
                budgetId: data.budgetId,
                actualName: data.actualName,
                updatedBy: data.updatedBy,
                exDate: data.exDate
            });
            toast.success("Actual registered successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to register actual";
            toast.error(errorMessage);
        }
    };

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
            await loadData();
        } catch (error: any) {
            const errMessage = error?.response?.data?.error || errorMessage;
            toast.error(errMessage);
        }
    };

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
            
            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            // Debug: log budget data to see done field
            console.log('Budgets data:', budgetsData.slice(0, 2).map(b => ({ id: b.id, name: b.name, done: b.done, active: b.active })));
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
            
            const actualsData = Array.isArray(actualsRes.data) ? actualsRes.data : [];
            const actualsMap: {[budgetId: string]: {id: string, name: string, amount: number, exDate: Date}[]} = {};
            actualsData.forEach((actual: any) => {
                if (actual.budget) {
                    if (!actualsMap[actual.budget]) {
                        actualsMap[actual.budget] = [];
                    }
                    actualsMap[actual.budget].push({
                        id: actual.id,
                        name: actual.name,
                        amount: actual.amount,
                        exDate: actual.exDate ? new Date(actual.exDate) : new Date()
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
                done: false
            },
            "Header added successfully",
            "Failed to add header"
        );
        setIsAddHeaderDialogOpen(false);
        setHeaderForm({ name: '', type: 'expense', tags: '' });
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
                note: budgetForm.note,
                type: budgetForm.type,
                amount: budgetForm.amount,
                tags: parseTags(budgetForm.tags),
                project: projectId,
                header: selectedHeaderId,
                done: false
            },
            "Budget added successfully",
            "Failed to add budget"
        );
        setIsAddBudgetDialogOpen(false);
        setBudgetForm({ name: '', note: '', type: 'expense', amount: 0, tags: '' });
    };

    const handleDeleteHeader = async (id: string) => {
        const header = headers.find(h => h.id === id);
        if (!header) {
            toast.error("Header not found");
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
        resetHeaderForm();
    };

    const openEditBudget = (budget: Budget) => {
        setEditBudgetForm({
            id: budget.id,
            name: budget.name,
            note: budget.note || '',
            type: budget.type,
            amount: budget.amount,
            tags: budget.tags.join(', '),
            done: budget.done,
            updatedAt: budget.updatedAt ? new Date(budget.updatedAt) : new Date(),
            updatedBy: budget.updatedBy || ''
        });
        setIsEditBudgetDialogOpen(true);
    };

    const handleDeleteBudget = async (budgetId: string) => {
        if (!showConfirm("Are you sure you want to delete this budget?")) return;
        await handleDeleteOperation(
            async () => {
                await budgetApi.delete(budgetId);
                setIsEditBudgetDialogOpen(false);
            },
            "Budget deleted successfully",
            "Failed to delete budget"
        );
    };

    const handleEditBudget = async () => {
        await handleUpdateOperation(
            budgetApi.update,
            editBudgetForm.id,
            {
                name: editBudgetForm.name.trim(),
                note: editBudgetForm.note,
                type: editBudgetForm.type,
                amount: editBudgetForm.amount,
                tags: editBudgetForm.tags
                    .split(/\s*,\s*/)
                    .map(t => t.trim())
                    .filter(t => t.length > 0),
                done: editBudgetForm.done
            },
            "Budget updated successfully",
            "Failed to update budget"
        );
        setIsEditBudgetDialogOpen(false);
        resetBudgetForm();
    };

    const openEditActual = (actual: {id: string, name: string, amount: number}) => {
        // Navigate to actual detail page
        navigate(`/actuals/${actual.id}`);
    };

    const handleDeleteActual = async (actualId: string) => {
        if (!showConfirm("Are you sure you want to delete this actual?")) return;
        await handleDeleteOperation(
            async () => {
                await actualApi.delete(actualId);
                setIsEditActualDialogOpen(false);
            },
            "Actual deleted successfully",
            "Failed to delete actual"
        );
    };

    const handleEditActual = async () => {
        if (!editActualForm.id) {
            // Register new actual from budget
            const budget = budgets.find(b => b.name === editActualForm.name);
            if (budget) {
                await handleCreateOperation(
                    budgetApi.registerActual,
                    {
                        budgetId: budget.id,
                        actualName: editActualForm.name,
                        updatedBy: 'user123',
                        exDate: editActualForm.exDate
                    },
                    "Actual registered successfully",
                    "Failed to register actual"
                );
            }
        } else {
            // Update existing actual
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
        }
        setIsEditActualDialogOpen(false);
        resetActualForm();
    };

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

    const renderToolbar = () => (
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
    );

    const renderHeader = (header: Header) => {
        const associatedBudgets = budgets.filter(b => b.header === header.id);
        const headerTotal = getHeaderTotal(header);

        return (
            <HeaderSortableItem key={header.id} id={header.id} isExpanded={expandedHeaders.has(header.id)}>
                <Card className="transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div
                            className={`cursor-move space-y-1 ${!expandedHeaders.has(header.id) ? 'cursor-grab' : 'cursor-not-allowed'}`}
                        >
                            <div className="flex items-center gap-3">
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
                                <div className="flex items-center gap-2 text-muted-foreground border-l border-border pl-3">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        header.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {getTypeLabel(header.type)}
                                    </span>
                                    <span className="text-xs">{formatNumber(headerTotal)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {associatedBudgets.length > 0 && Array.from(selectedBudgetIds).some(id => associatedBudgets.some(b => b.id === id)) && (
                                (() => {
                                    const selectedCount = Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id)).length;
                                    const selectedBudgets = budgets.filter(b => selectedBudgetIds.has(b.id));
                                    return (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                <Button size="sm" type="button" className="h-8 px-3" onClick={(e) => {
                                                    e.stopPropagation();
                                                }}>
                                                    {selectedCount} selected
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {selectedCount === 1 && (
                                                    <DropdownMenuItem onClick={openRegisterActual}>
                                                        Register Actual
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => {
                                                    const selectedInHeader = Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id));
                                                    setBudgetsToDelete(selectedInHeader);
                                                    setIsDeleteConfirmOpen(true);
                                                }}>
                                                    Delete
                                                </DropdownMenuItem>
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
                            <BudgetTable header={header} associatedBudgets={associatedBudgets} />
                        )}
                    </CardContent>
                </Card>
            </HeaderSortableItem>
        );
    };

    const BudgetTable = ({ header, associatedBudgets }: { header: Header; associatedBudgets: Budget[] }) => (
        <DndContext onDragEnd={(event) => handleBudgetDragEnd(event, header.id)}>
            <Table className="table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10 px-2 text-left bg-cyan-50">
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
                        <TableHead className="w-[35%] px-2 text-left border-b border-gray-200 bg-cyan-50">Name</TableHead>
                        <TableHead className="w-[18%] px-2 text-left border-b border-gray-200 bg-cyan-50">Tags</TableHead>
                        <TableHead className="w-[12%] px-2 text-center border-b border-gray-200 bg-cyan-50">stat</TableHead>
                        <TableHead className="text-right w-[9%] border-b border-gray-200 bg-cyan-50">Amount</TableHead>
                        <TableHead className="text-left w-[28%] border-l-2 border-border bg-cyan-50">actName</TableHead>
                        <TableHead className="text-right w-[10%] bg-cyan-50">actAmount</TableHead>
                        <TableHead className="text-left w-[11%] bg-cyan-50">actDate</TableHead>
                    </TableRow>
                </TableHeader>
                <SortableContext items={associatedBudgets.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <TableBody>
                        {associatedBudgets.flatMap((budget) => {
                            const budgetActuals = actuals[budget.id] || [];
                            if (budgetActuals.length === 0) {
                                return renderBudgetRow(budget, null, 0);
                            }
                            return budgetActuals.map((actual, index) => renderBudgetRow(budget, actual, index));
                        })}
                    </TableBody>
                </SortableContext>
            </Table>
        </DndContext>
    );

    const renderBudgetRow = (budget: Budget, actual: {id: string, name: string, amount: number} | null, index: number) => {
        const budgetActuals = actuals[budget.id] || [];
        const isDraggable = index === 0;
        const rowKey = index === 0 ? budget.id : actual?.id || budget.id;
        const hasActuals = budgetActuals.length > 0;

        if (!hasActuals) {
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
                    <TableCell className="w-[45%] px-2 text-left border-b border-gray-200">
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
                    <TableCell className="w-[25%] px-2 text-left border-b border-gray-200">
                        {budget.tags && budget.tags.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                                {budget.tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                        )}
                    </TableCell>
                    <TableCell className="w-[12%] px-2 text-center border-b border-gray-200">
                        <div className="flex items-center justify-center gap-1">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {budget.type === 'income' ? 'i' : 'e'}
                            </span>
                            {budget.done ? (
                                <CheckSquare className="w-5 h-5 text-green-700 fill-green-100" />
                            ) : (
                                <Square className="w-5 h-5 text-red-700" />
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="w-[12.5%] text-right border-b border-gray-200">
                        <span className="text-xs">
                            {formatNumber(budget.amount)}
                        </span>
                    </TableCell>
                    <TableCell className="w-[40%] text-left border-b border-gray-200 border-l-2 border-border">
                        <span className="text-sm text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell className="w-[20%] text-right border-b border-gray-200">
                        <span className="text-sm text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell className="w-[11%] text-left border-b border-gray-200">
                        <span className="text-xs text-muted-foreground">-</span>
                    </TableCell>
                </BudgetSortableRow>
            );
        }

        const sharedCells = (
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
                <TableCell rowSpan={budgetActuals.length} className="w-[45%] px-2 text-left border-b border-gray-200">
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
                <TableCell rowSpan={budgetActuals.length} className="w-[25%] px-2 text-left border-b border-gray-200">
                    {budget.tags && budget.tags.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {budget.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                    )}
                </TableCell>
                <TableCell rowSpan={budgetActuals.length} className="w-[12%] px-2 text-center border-b border-gray-200">
                    <div className="flex items-center justify-center gap-1">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {budget.type === 'income' ? 'i' : 'e'}
                        </span>
                        {budget.done ? (
                            <CheckSquare className="w-5 h-5 text-green-700 fill-green-100" />
                        ) : (
                            <Square className="w-5 h-5 text-red-700" />
                        )}
                    </div>
                </TableCell>
                <TableCell rowSpan={budgetActuals.length} className="w-[12.5%] text-right border-b border-gray-200">
                    <span className="text-xs">
                        {formatNumber(budget.amount)}
                    </span>
                </TableCell>
            </>
        );

        const lastRowClass = index === budgetActuals.length - 1 ? "border-b border-gray-200" : "";

        return (
            <BudgetSortableRow key={rowKey} id={rowKey} disabled={!isDraggable}>
                {index === 0 && sharedCells}
                <TableCell className={`w-[28%] text-left ${lastRowClass} border-l-2 border-border border-b border-gray-200`}>
                    <span 
                        className="text-xs text-muted-foreground hover:underline cursor-pointer" 
                        title={actual?.name}
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditActual(actual!);
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {actual?.name}
                    </span>
                </TableCell>
                <TableCell className={`w-[10%] text-right ${lastRowClass} border-b border-gray-200`}>
                    <span className="text-xs text-muted-foreground">
                        {formatNumber(actual?.amount || 0)}
                    </span>
                </TableCell>
                <TableCell className={`w-[11%] text-left ${lastRowClass} border-b border-gray-200`}>
                    <span className="text-xs text-muted-foreground">
                        {actual?.exDate ? formatDate(actual.exDate) : '-'}
                    </span>
                </TableCell>
            </BudgetSortableRow>
        );
    };

    const renderRegisterMultipleConfirmDialog = () => (
        <Dialog open={isRegisterMultipleConfirmOpen} onOpenChange={setIsRegisterMultipleConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Register Budgets to Actual</DialogTitle>
                    <DialogDescription>
                        This will create Actual records for {budgetsToRegister.length} selected budget(s).
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <label className="text-sm font-medium">Execution Date (exDate)</label>
                        <input
                            type="date"
                            className="w-full mt-2 px-3 py-2 border border-input bg-background rounded-md"
                            value={multipleExDate.toISOString().split('T')[0]}
                            onChange={(e) => setMultipleExDate(new Date(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            All {budgetsToRegister.length} budgets will use this execution date.
                        </p>
                    </div>
                    <div className="space-y-2">
                        {budgetsToRegister.map((budget, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div>
                                    <div className="font-medium">{budget.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {budget.type === 'income' ? 'Income' : 'Expense'} - {formatNumber(budget.amount)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setIsRegisterMultipleConfirmOpen(false);
                        setBudgetsToRegister([]);
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={() => handleRegisterMultipleBudgets(budgetsToRegister, multipleExDate)}>
                        Register Actual {budgetsToRegister.length} budget{budgetsToRegister.length !== 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const renderDeleteConfirmDialog = () => {
        const budgetsWithActuals = budgetsToDelete.filter(budgetId => {
            const budget = budgets.find(b => b.id === budgetId);
            return budget && actuals[budgetId] && actuals[budgetId].length > 0;
        });
        const deletableCount = budgetsToDelete.length - budgetsWithActuals.length;
        
        return (
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Budgets</DialogTitle>
                        <DialogDescription>
                            {budgetsWithActuals.length > 0 && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800 font-medium">
                                        Cannot delete {budgetsWithActuals.length} budget(s) with actuals
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Only {deletableCount} budget(s) without actuals will be deleted
                                    </p>
                                </div>
                            )}
                            {deletableCount > 0 ? (
                                <p>Are you sure you want to delete {deletableCount} budget{deletableCount !== 1 ? 's' : ''}?</p>
                            ) : (
                                <p>No budgets can be deleted. All selected budgets have actuals.</p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setIsDeleteConfirmOpen(false);
                            setBudgetsToDelete([]);
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSelectedBudgets} disabled={deletableCount === 0}>
                            Delete {deletableCount} budget{deletableCount !== 1 ? 's' : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="space-y-8">
            {renderToolbar()}
            
            <DndContext onDragEnd={handleHeaderDragEnd}>
                <div className="grid gap-4">
                    <SortableContext items={headers.map((h) => h.id)} strategy={verticalListSortingStrategy}>
                        {headers.map((header) => renderHeader(header))}
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
                isNew={!editActualForm.id}
            />

            <ActualRegisterDialog
                isOpen={isRegisterActualDialogOpen}
                onOpenChange={setIsRegisterActualDialogOpen}
                budget={budgetToRegister || {
                    id: '',
                    name: '',
                    note: '',
                    type: 'expense' as 'income' | 'expense',
                    amount: 0,
                    tags: [],
                    project: '',
                    header: '',
                    arrActual: [],
                    done: false
                }}
                onRegisterActual={handleRegisterActual}
            />

            {renderRegisterMultipleConfirmDialog()}
            {renderDeleteConfirmDialog()}
        </div>
    );
}

export default ProjectBudgets;
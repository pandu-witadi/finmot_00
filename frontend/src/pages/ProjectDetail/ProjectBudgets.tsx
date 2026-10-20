import { useState, useEffect } from "react";
import { headerApi, budgetApi, projectApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { HeaderAddDialog } from "./HeaderAddDialog";
import { BudgetAddDialog } from "./BudgetAddDialog";
import { HeaderEditDialog } from "./HeaderEditDialog";
import { BudgetEditDialog } from "./BudgetEditDialog";
import { Header } from "./useBudgetHeaders";
import { Budget } from "./useBudgets";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

function formatNumber(value: number): string {
    const num = Number(value) || 0;
    const [integer, decimal] = num.toFixed(2).split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInteger},${decimal}`;
}

function getTypeLabel(type: 'income' | 'expense'): string {
    return type === 'income' ? 'in' : 'ex';
}

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
function BudgetSortableRow({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
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

    const toggleSelectBudget = (budgetId: string) => {
        const newSet = new Set(selectedBudgetIds);
        newSet.has(budgetId) ? newSet.delete(budgetId) : newSet.add(budgetId);
        console.log('[Budget Selection] Updated selected IDs:', Array.from(newSet));
        console.log('[Budget Selection] Total selected:', newSet.size);
        setSelectedBudgetIds(newSet);
    };

    const toggleSelectAllBudgets = (budgets: {id: string}[]) => {
        const allSelected = budgets.length > 0 && budgets.every(b => selectedBudgetIds.has(b.id));
        const newSet = new Set(selectedBudgetIds);
        budgets.forEach(b => {
            allSelected ? newSet.delete(b.id) : newSet.add(b.id);
        });
        console.log('[Select All] All selected:', allSelected, 'Budgets:', budgets.map(b => b.id));
        console.log('[Select All] Updated selected IDs:', Array.from(newSet));
        console.log('[Select All] Total selected:', newSet.size);
        setSelectedBudgetIds(newSet);
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    // Expand all headers by default
    useEffect(() => {
        if (headers.length > 0) {
            setExpandedHeaders(new Set(headers.map((h) => h.id)));
        }
    }, [headers]);

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId)
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

        try {
            await headerApi.create({
                name: headerForm.name.trim(),
                type: headerForm.type,
                tags: headerForm.tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0),
                project: projectId,
                active: true
            });
            toast.success("Header added successfully");
            setIsAddHeaderDialogOpen(false);
            setHeaderForm({ name: '', type: 'expense', tags: '' });
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to add header";
            toast.error(errorMessage);
        }
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

        try {
            await budgetApi.create({
                name: budgetForm.name.trim(),
                type: budgetForm.type,
                amount: budgetForm.amount,
                tags: budgetForm.tags
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0),
                project: projectId,
                header: selectedHeaderId,
                active: true
            });
            toast.success("Budget added successfully");
            setIsAddBudgetDialogOpen(false);
            setBudgetForm({ name: '', type: 'expense', amount: 0, tags: '' });
            setSelectedHeaderId(null);
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to add budget";
            toast.error(errorMessage);
        }
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
        
        if (!window.confirm("Delete this header?")) {
            return;
        }

        try {
            await headerApi.delete(id);
            toast.success("Header deleted successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete header";
            toast.error(errorMessage);
        }
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
        try {
            const tagArray = editHeaderForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            await headerApi.update(editHeaderForm.id, {
                name: editHeaderForm.name.trim(),
                type: editHeaderForm.type,
                tags: tagArray
            });
            toast.success("Header updated successfully");
            setIsEditHeaderDialogOpen(false);
            setEditHeaderForm({ id: '', name: '', type: 'expense', tags: '' });
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update header";
            toast.error(errorMessage);
        }
    };

    const handleDeleteBudget = async (id: string) => {
        if (!window.confirm("Delete this budget item?")) {
            return;
        }

        try {
            await budgetApi.delete(id);
            toast.success("Budget deleted successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete budget";
            toast.error(errorMessage);
        }
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

    const handleEditBudget = async () => {
        try {
            const tagArray = editBudgetForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            await budgetApi.update(editBudgetForm.id, {
                name: editBudgetForm.name.trim(),
                type: editBudgetForm.type,
                amount: editBudgetForm.amount,
                tags: tagArray
            });
            toast.success("Budget updated successfully");
            setIsEditBudgetDialogOpen(false);
            setEditBudgetForm({ id: '', name: '', type: 'expense', amount: 0, tags: '' });
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update budget";
            toast.error(errorMessage);
        }
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
        try {
            const projectHeaderOrder = headers.map(h => h.id);
            await projectApi.update(projectId, { arrHeader: projectHeaderOrder });
            toast.success("Header positions saved successfully");
            await loadData();
        } catch (error: any) {
            console.error("Failed to save header positions:", error);
            toast.error("Failed to save header positions");
        }
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

        if (!window.confirm(`Save positions for ${header.name}? This will update the order of ${associatedBudgets.length} budgets.`)) {
            return;
        }

        try {
            const budgetIds = associatedBudgets.map(b => b.id);
            await headerApi.update(headerId, { arrBudget: budgetIds });
            toast.success("Budget positions saved successfully");
            await loadData();
        } catch (error: any) {
            console.error("Failed to save budget positions:", error);
            toast.error("Failed to save budget positions");
        }
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
                    <Button variant="outline" onClick={handleSaveHeaderPositions}>
                        Save Header Positions
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
                                                {selectedBudgetIds.size > 0 && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm">
                                                                {selectedBudgetIds.size} selected
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                toast.success("Clone action would clone " + selectedBudgetIds.size + " budgets");
                                                            }}>
                                                                Clone
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                toast.success("Register action would register " + selectedBudgetIds.size + " budgets");
                                                            }}>
                                                                Register
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
                                                    title="Save header budget positions"
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
                                                                    <TableHead className="w-[50%] px-2 text-left">Name</TableHead>
                                                                    <TableHead className="w-[12.5%] px-2 text-left">Type</TableHead>
                                                                    <TableHead className="text-right w-[12.5%]">Amount</TableHead>
                                                                    <TableHead className="text-right w-[25%] border-l">Actual</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <SortableContext items={associatedBudgets.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                                                <TableBody>
                                                                    {associatedBudgets.map((budget) => (
                                                                        <BudgetSortableRow key={budget.id} id={budget.id}>
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
                                                                            <TableCell className="w-[50%] px-2 text-left">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span
                                                                                        className="cursor-pointer hover:underline font-medium"
                                                                                        onClick={() => openEditBudget(budget)}
                                                                                    >
                                                                                        {budget.name}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6"
                                                                                            onClick={(e) => { e.stopPropagation(); openEditBudget(budget); }}
                                                                                            title="Edit budget"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                                                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                                                <path d="m15 5 4 4" />
                                                                                            </svg>
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6"
                                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteBudget(budget.id); }}
                                                                                            title="Delete budget"
                                                                                        >
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                                                                <path d="M3 6h18" />
                                                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                                                <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                                                                                            </svg>
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="w-[12.5%] px-2 text-left">
                                                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                                                    budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                                }`}>
                                                                                    {getTypeLabel(budget.type)}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="w-[12.5%] text-right">
                                                                                <span className="text-sm">
                                                                                    {formatNumber(budget.amount)}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="w-[12.5%] text-right border-l">
                                                                            </TableCell>
                                                                        </BudgetSortableRow>
                                                                    ))}
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
            />
        </div>
    );
}

export default ProjectBudgets;
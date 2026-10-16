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
import { Header, Budget } from "./useBudgets";

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

export function ProjectBudgets({ projectId }: ProjectBudgetsProps) {
    const [headers, setHeaders] = useState<Header[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddHeaderDialogOpen, setIsAddHeaderDialogOpen] = useState(false);
    const [isEditHeaderDialogOpen, setIsEditHeaderDialogOpen] = useState(false);
    const [isAddBudgetDialogOpen, setIsAddBudgetDialogOpen] = useState(false);
    const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
    const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);
    const [draggedHeaderId, setDraggedHeaderId] = useState<string | null>(null);
    const [dragOverHeaderId, setDragOverHeaderId] = useState<string | null>(null);
    const [draggedBudgetId, setDraggedBudgetId] = useState<string | null>(null);
    const [dragOverBudgetId, setDragOverBudgetId] = useState<string | null>(null);
    const [draggedBudgetHeaderId, setDraggedBudgetHeaderId] = useState<string | null>(null);

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

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId)
            ]);
            setHeaders(headersRes.data);
            setBudgets(budgetsRes.data);
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

    // Header drag/drop handlers
    const handleHeaderDragStart = (e: React.DragEvent, headerId: string) => {
        setDraggedHeaderId(headerId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleHeaderDragOver = (e: React.DragEvent, headerId: string) => {
        e.preventDefault();
        if (headerId !== draggedHeaderId) {
            setDragOverHeaderId(headerId);
        }
    };

    const handleHeaderDragLeave = () => {
        setDragOverHeaderId(null);
    };

    const handleHeaderDrop = (e: React.DragEvent, targetHeaderId: string) => {
        e.preventDefault();
        setDragOverHeaderId(null);

        if (!draggedHeaderId || draggedHeaderId === targetHeaderId) {
            setDraggedHeaderId(null);
            return;
        }

        setHeaders((prevHeaders) => {
            const newHeaders = [...prevHeaders];
            const draggedIndex = newHeaders.findIndex(h => h.id === draggedHeaderId);
            const targetIndex = newHeaders.findIndex(h => h.id === targetHeaderId);

            if (draggedIndex > -1 && targetIndex > -1) {
                const [draggedHeader] = newHeaders.splice(draggedIndex, 1);
                const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                newHeaders.splice(adjustedTargetIndex, 0, draggedHeader);
            }

            return newHeaders;
        });

        setDraggedHeaderId(null);
    };

    const handleHeaderDragEnd = () => {
        setDraggedHeaderId(null);
        setDragOverHeaderId(null);
    };

    // Budget drag/drop handlers
    const handleBudgetDragStart = (e: React.DragEvent, budgetId: string, headerId: string) => {
        setDraggedBudgetId(budgetId);
        setDraggedBudgetHeaderId(headerId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleBudgetDragOver = (e: React.DragEvent, budgetId: string) => {
        e.preventDefault();
        if (budgetId !== draggedBudgetId) {
            setDragOverBudgetId(budgetId);
        }
    };

    const handleBudgetDragLeave = () => {
        setDragOverBudgetId(null);
    };

    const handleBudgetDrop = (e: React.DragEvent, targetBudgetId: string) => {
        e.preventDefault();
        setDragOverBudgetId(null);

        if (!draggedBudgetId || draggedBudgetId === targetBudgetId) {
            setDraggedBudgetId(null);
            setDraggedBudgetHeaderId(null);
            return;
        }

        const headerIndex = headers.findIndex(h => h.id === draggedBudgetHeaderId);
        if (headerIndex === -1) {
            setDraggedBudgetId(null);
            setDraggedBudgetHeaderId(null);
            return;
        }

        const header = headers[headerIndex];
        const budgetsInHeader = budgets.filter(b => b.header === header.id);
        
        const draggedIndex = budgetsInHeader.findIndex(b => b.id === draggedBudgetId);
        const targetIndex = budgetsInHeader.findIndex(b => b.id === targetBudgetId);

        if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedBudget] = budgetsInHeader.splice(draggedIndex, 1);
            const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            budgetsInHeader.splice(adjustedTargetIndex, 0, draggedBudget);

            setBudgets((prevBudgets) => {
                const newBudgets = [...prevBudgets];
                const headerBudgetIds = budgetsInHeader.map(b => b.id);
                return newBudgets.map(b => {
                    if (headerBudgetIds.includes(b.id)) {
                        return budgetsInHeader.find(nb => nb.id === b.id) || b;
                    }
                    return b;
                });
            });
        }

        setDraggedBudgetId(null);
        setDraggedBudgetHeaderId(null);
    };

    const handleBudgetDragEnd = () => {
        setDraggedBudgetId(null);
        setDragOverBudgetId(null);
        setDraggedBudgetHeaderId(null);
    };

    const getHeaderTotal = (header: Header) => {
        return budgets
            .filter(b => b.header === header.id)
            .reduce((sum, b) => sum + (b.type === 'income' ? b.amount : -b.amount), 0);
    };

    // Save positions function
    const handleSavePositions = async () => {
        try {
            // Save header order to project.arrHeader
            const projectHeaderOrder = headers.map(h => h.id);
            await projectApi.update(projectId, { arrHeader: projectHeaderOrder });
            
            // Save budget order to each header.arrBudget
            const updateHeaderPromises = headers.map((header) => {
                const headerBudgets = budgets.filter(b => b.header === header.id);
                const budgetIds = headerBudgets.map(b => b.id);
                return headerApi.update(header.id, { arrBudget: budgetIds });
            });
            
            await Promise.all(updateHeaderPromises);
            toast.success("Positions saved successfully");
            await loadData();
        } catch (error: any) {
            console.error("Failed to save positions:", error);
            toast.error("Failed to save positions");
        }
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
                    <Button variant="outline" onClick={handleSavePositions}>
                        Save Positions
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {headers.map((header) => {
                    const associatedBudgets = budgets.filter(b => b.header === header.id);
                    const headerTotal = getHeaderTotal(header);

                    return (
                        <Card
                            key={header.id}
                            className={`cursor-move transition-all ${
                                draggedHeaderId === header.id ? 'opacity-50 scale-95' : ''
                            } ${
                                dragOverHeaderId === header.id ? 'ring-2 ring-primary' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleHeaderDragStart(e, header.id)}
                            onDragOver={(e) => handleHeaderDragOver(e, header.id)}
                            onDragLeave={handleHeaderDragLeave}
                            onDrop={(e) => handleHeaderDrop(e, header.id)}
                            onDragEnd={handleHeaderDragEnd}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{header.name}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            header.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {getTypeLabel(header.type)}
                                        </span>
                                        <span>{formatNumber(headerTotal)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setSelectedHeaderId(header.id);
                                            setIsAddBudgetDialogOpen(true);
                                        }}
                                        title="Add budget"
                                    >
                                        +
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditHeader(header)}
                                        title="Edit header"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            <path d="m15 5 4 4" />
                                        </svg>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteHeader(header.id)}
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
                            <CardContent>
                                {associatedBudgets.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        No budgets under this header
                                    </p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {associatedBudgets.map(budget => (
                                                <TableRow
                                                    key={budget.id}
                                                    className={`hover:bg-muted/50 cursor-move ${
                                                        draggedBudgetId === budget.id ? 'opacity-50' : ''
                                                    } ${
                                                        dragOverBudgetId === budget.id ? 'ring-2 ring-primary' : ''
                                                    }`}
                                                    draggable
                                                    onDragStart={(e) => handleBudgetDragStart(e, budget.id, header.id)}
                                                    onDragOver={(e) => handleBudgetDragOver(e, budget.id)}
                                                    onDragLeave={handleBudgetDragLeave}
                                                    onDrop={(e) => handleBudgetDrop(e, budget.id)}
                                                    onDragEnd={handleBudgetDragEnd}
                                                >
                                                    <TableCell className="font-medium">{budget.name}</TableCell>
                                                    <TableCell>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                            budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {getTypeLabel(budget.type)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatNumber(budget.amount)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditBudget(budget)}
                                                            title="Edit budget"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                <path d="m15 5 4 4" />
                                                            </svg>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteBudget(budget.id)}
                                                            title="Delete budget"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                <path d="M19 4v16c0 1-1 2-2 2H7c-1 0-2-1-2-2V4" />
                                                            </svg>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

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
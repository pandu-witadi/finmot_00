import { useState, useEffect } from 'react';
import { headerApi, budgetApi, actualApi, projectApi } from '@/services/api';
import { toast } from 'react-hot-toast';
import { Header, Budget, Actual, EditHeaderForm, EditBudgetForm, EditActualForm, BudgetWithName, HeaderForm, BudgetForm } from './types';
import { parseTags } from '@/utils/formatters';
import { arrayMove } from '@dnd-kit/sortable';

// Custom hook for Project Budgets state and logic
export function useProjectBudgets(projectId: string) {
    // State
    const [headers, setHeaders] = useState<Header[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set<string>());
    const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set<string>());
    const [actuals, setActuals] = useState<{ [budgetId: string]: Actual[] }>({});

    // Dialog states
    const [isAddHeaderDialogOpen, setIsAddHeaderDialogOpen] = useState(false);
    const [isEditHeaderDialogOpen, setIsEditHeaderDialogOpen] = useState(false);
    const [isAddBudgetDialogOpen, setIsAddBudgetDialogOpen] = useState(false);
    const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [isCloneConfirmOpen, setIsCloneConfirmOpen] = useState(false);

    // Form states
    const [headerForm, setHeaderForm] = useState<HeaderForm>({
        name: '',
        type: 'expense',
        tags: ''
    });

    const [editHeaderForm, setEditHeaderForm] = useState<EditHeaderForm>({
        id: '',
        name: '',
        type: 'expense',
        tags: ''
    });

    const [editBudgetForm, setEditBudgetForm] = useState<EditBudgetForm>({
        id: '',
        name: '',
        type: 'expense',
        amount: 0,
        tags: ''
    });

    const [budgetForm, setBudgetForm] = useState<BudgetForm>({
        name: '',
        type: 'expense',
        amount: 0,
        tags: ''
    });

    const [editActualForm, setEditActualForm] = useState<EditActualForm>({
        id: '',
        name: '',
        amount: 0
    });

    const [clonedBudgets, setClonedBudgets] = useState<BudgetWithName[]>([]);
    const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);

    // Load data from API
    const loadData = async () => {
        try {
            const [headersRes, budgetsRes, actualsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId),
                actualApi.getAllByProject(projectId)
            ]);

            const headersData = Array.isArray(headersRes.data) ? headersRes.data : [];
            setHeaders(headersData);

            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
            const sortedBudgets = budgetsData.sort((a, b) => {
                const headerA = headersData.find(h => h.id === a.header);
                const headerB = headersData.find(h => h.id === b.header);
                if (!headerA || !headerB) return 0;
                const arrA = headerA.arrBudget || [];
                const arrB = headerB.arrBudget || [];
                const indexA = arrA.indexOf(a.id);
                const indexB = arrB.indexOf(b.id);
                return indexA - indexB;
            });
            setBudgets(sortedBudgets);

            const actualsData = Array.isArray(actualsRes.data) ? actualsRes.data : [];
            const actualsMap: { [budgetId: string]: Actual[] } = {};
            actualsData.forEach((actual: Actual) => {
                if (actual.budget) {
                    if (!actualsMap[actual.budget]) {
                        actualsMap[actual.budget] = [];
                    }
                    actualsMap[actual.budget].push(actual);
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

    useEffect(() => {
        loadData();
    }, [projectId]);

    // Expand all headers by default
    useEffect(() => {
        if (headers.length > 0) {
            setExpandedHeaders(new Set(headers.map((h) => h.id)));
        }
    }, [headers]);

    // Header operations
    const handleAddHeader = async () => {
        if (!headerForm.name.trim()) {
            toast.error("Header name is required");
            return;
        }

        try {
            await headerApi.create({
                name: headerForm.name.trim(),
                type: headerForm.type,
                tags: parseTags(headerForm.tags),
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

    const handleEditHeader = async () => {
        try {
            const tagArray = parseTags(editHeaderForm.tags);
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

    const handleDeleteHeader = async (id: string) => {
        const header = headers.find(h => h.id === id);
        if (!header) {
            toast.error("Header not found");
            return;
        }

        const arrBudget = Array.isArray(header.arrBudget) ? header.arrBudget : [];
        const budgetsUnderHeader = budgets.filter(b => b.header === id);

        if (arrBudget.length > 0 || budgetsUnderHeader.length > 0) {
            toast.error(`Cannot delete header. There are ${arrBudget.length + budgetsUnderHeader.length} budgets associated with this header. Please remove budgets first.`);
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

    // Budget operations
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
                tags: parseTags(budgetForm.tags),
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

    const handleEditBudget = async () => {
        try {
            const tagArray = parseTags(editBudgetForm.tags);
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

    const handleDeleteBudget = async (budgetId: string) => {
        if (!window.confirm("Delete this budget item?")) {
            return;
        }

        try {
            await budgetApi.delete(budgetId);
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

    // Actual operations
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

    const openEditActual = (actual: Actual) => {
        setEditActualForm({
            id: actual.id,
            name: actual.name,
            amount: actual.amount
        });
        setIsEditActualDialogOpen(true);
    };

    // Selection and drag/drop
    const toggleSelectBudget = (budgetId: string) => {
        const newSet = new Set(selectedBudgetIds);
        newSet.has(budgetId) ? newSet.delete(budgetId) : newSet.add(budgetId);
        setSelectedBudgetIds(newSet);
    };

    const toggleSelectAllBudgets = (budgetsToSelect: { id: string }[]) => {
        const allSelected = budgetsToSelect.length > 0 && budgetsToSelect.every(b => selectedBudgetIds.has(b.id));
        const newSet = new Set(selectedBudgetIds);
        budgetsToSelect.forEach(b => {
            allSelected ? newSet.delete(b.id) : newSet.add(b.id);
        });
        setSelectedBudgetIds(newSet);
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

    // Clone operations
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

    const handleCloneToTransactionForSelected = async () => {
        const selectedBudgets = budgets.filter(b => selectedBudgetIds.has(b.id));
        const allActuals: { budgetId: string, actualId: string, actualName: string }[] = [];

        selectedBudgets.forEach(budget => {
            if (budget.arrActual) {
                budget.arrActual.forEach(actualId => {
                    allActuals.push({
                        budgetId: budget.id,
                        actualId: actualId,
                        actualName: `Actual from ${budget.name}`
                    });
                });
            }
        });

        if (allActuals.length === 0) {
            toast.error("No actuals found for selected budgets");
            return;
        }

        toast(`Clone to transaction would create transactions for ${allActuals.length} actuals`);
    };

    // Header expansion
    const toggleHeaderExpansion = (headerId: string) => {
        const newExpanded = new Set(expandedHeaders);
        if (newExpanded.has(headerId)) {
            newExpanded.delete(headerId);
        } else {
            newExpanded.add(headerId);
        }
        setExpandedHeaders(newExpanded);
    };

    // Header drag/drop
    const handleHeaderDragEnd = (event: any) => {
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

    // Calculation helpers
    const getHeaderTotal = (header: Header) => {
        const headerBudgets = budgets.filter(b => b.header === header.id);
        return headerBudgets.reduce((sum, b) => sum + (b.type === 'income' ? b.amount : -b.amount), 0);
    };

    const getAssociatedBudgets = (headerId: string) => {
        return budgets.filter(b => b.header === headerId);
    };

    return {
        // State
        headers,
        budgets,
        isLoading,
        expandedHeaders,
        selectedBudgetIds,
        actuals,

        // Dialog states
        isAddHeaderDialogOpen,
        isEditHeaderDialogOpen,
        isAddBudgetDialogOpen,
        isEditBudgetDialogOpen,
        isEditActualDialogOpen,
        isCloneConfirmOpen,

        // Form states
        headerForm,
        editHeaderForm,
        editBudgetForm,
        budgetForm,
        editActualForm,
        clonedBudgets,
        selectedHeaderId,

        // Actions
        loadData,
        handleAddHeader,
        handleEditHeader,
        handleDeleteHeader,
        openEditHeader,
        handleAddBudget,
        handleEditBudget,
        handleDeleteBudget,
        openEditBudget,
        handleEditActual,
        handleDeleteActual,
        openEditActual,
        toggleSelectBudget,
        toggleSelectAllBudgets,
        handleSaveHeaderPositions,
        handleSaveBudgetPositions,
        openCloneConfirm,
        handleCloneConfirm,
        handleCloneToTransactionForSelected,
        toggleHeaderExpansion,
        handleHeaderDragEnd,
        getHeaderTotal,
        getAssociatedBudgets,

        // Setters
        setHeaderForm,
        setEditHeaderForm,
        setEditBudgetForm,
        setBudgetForm,
        setEditActualForm,
        setIsAddHeaderDialogOpen,
        setIsEditHeaderDialogOpen,
        setIsAddBudgetDialogOpen,
        setIsEditBudgetDialogOpen,
        setIsEditActualDialogOpen,
        setIsCloneConfirmOpen,
        setSelectedHeaderId,
        setExpandedHeaders,
        setSelectedBudgetIds
    };
}
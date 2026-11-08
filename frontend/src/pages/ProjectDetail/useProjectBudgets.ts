import { useState, useEffect } from "react";
import { headerApi, budgetApi, actualApi, userApi, api } from "@/services/api";
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
import { Budget, BudgetWithName } from "./useBudgets";
import { EditHeaderForm, EditBudgetForm, EditActualForm, Actual } from "./types";
import { formatNumber, parseTags } from "@/utils/formatters";
import { formatDate } from "@/utils/dateFormatters";

interface Header {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string[];
    active: boolean;
    arrBudget: string[];
}

interface Budget {
    id: string;
    name: string;
    note?: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string[];
    project: string;
    header: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
}

interface Actual {
    id: string;
    name: string;
    note?: string;
    amount: number;
    budget: string;
    [key: string]: any;
}

interface User {
    id: string;
    name: string;
    email: string;
}

const useProjectBudgets = (projectId: string) => {
    const [headers, setHeaders] = useState<Header[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [actuals, setActuals] = useState<{ [budgetId: string]: Actual[] }>({});

    // Dialog states
    const [isAddHeaderDialogOpen, setIsAddHeaderDialogOpen] = useState(false);
    const [isEditHeaderDialogOpen, setIsEditHeaderDialogOpen] = useState(false);
    const [isAddBudgetDialogOpen, setIsAddBudgetDialogOpen] = useState(false);
    const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false);
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [isRegisterActualConfirmOpen, setIsRegisterActualConfirmOpen] = useState(false);

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
        note: '',
        type: 'expense',
        amount: 0,
        tags: ''
    });

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

    const [registeredBudgets, setRegisteredBudgets] = useState<BudgetWithName[]>([]);
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
            const actualsByBudget: { [budgetId: string]: Actual[] } = {};
            actualsData.forEach((actual: Actual) => {
                if (!actualsByBudget[actual.budget]) {
                    actualsByBudget[actual.budget] = [];
                }
                actualsByBudget[actual.budget].push(actual);
            });
            setActuals(actualsByBudget);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Failed to load data");
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    // Header operations
    const handleAddHeader = async () => {
        try {
            const tagArray = parseTags(headerForm.tags);
            await headerApi.create({
                name: headerForm.name.trim(),
                type: headerForm.type,
                tags: tagArray,
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
        if (!header) return;

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
                note: budgetForm.note,
                type: budgetForm.type,
                amount: budgetForm.amount,
                tags: parseTags(budgetForm.tags),
                project: projectId,
                header: selectedHeaderId,
                active: true
            });
            toast.success("Budget added successfully");
            setIsAddBudgetDialogOpen(false);
            setBudgetForm({ name: '', note: '', type: 'expense', amount: 0, tags: '' });
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
                note: editBudgetForm.note,
                type: editBudgetForm.type,
                amount: editBudgetForm.amount,
                tags: tagArray
            });
            toast.success("Budget updated successfully");
            setIsEditBudgetDialogOpen(false);
            setEditBudgetForm({ id: '', name: '', note: '', type: 'expense', amount: 0, tags: '' });
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update budget";
            toast.error(errorMessage);
        }
    };

    const handleDeleteBudget = async (budgetId: string) => {
        if (!window.confirm("Delete this budget?")) {
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
            note: budget.note || '',
            type: budget.type,
            amount: budget.amount,
            tags: budget.tags.join(', ')
        });
        setIsEditBudgetDialogOpen(true);
    };

    // Actual operations
    const handleEditActual = async () => {
        try {
            const tagArray = parseTags(editActualForm.tags);
            await actualApi.update(editActualForm.id, {
                name: editActualForm.name.trim(),
                note: editActualForm.note,
                amount: editActualForm.amount,
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
            note: actual.note || '',
            amount: actual.amount,
            exDate: new Date(),
            tags: (actual.tags || []).join(', '),
            assignedTo: actual.assignedTo || '',
            updatedAt: actual.updatedAt ? new Date(actual.updatedAt) : new Date(),
            updatedBy: actual.updatedBy || ''
        });
        setIsEditActualDialogOpen(true);
    };

    // Selection and drag/drop
    const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set<string>());

    const toggleBudgetSelection = (budgetId: string) => {
        setSelectedBudgetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(budgetId)) {
                newSet.delete(budgetId);
            } else {
                newSet.add(budgetId);
            }
            return newSet;
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeBudget = budgets.find(b => b.id === active.id);
        const overBudget = budgets.find(b => b.id === over.id);

        if (!activeBudget || !overBudget) {
            return;
        }

        const activeHeader = headers.find(h => h.id === activeBudget.header);
        const overHeader = headers.find(h => h.id === overBudget.header);

        if (!activeHeader || !overHeader || activeHeader.id !== overHeader.id) {
            return;
        }

        const activeArr = activeHeader.arrBudget || [];
        const overArr = overHeader.arrBudget || [];

        const activeIndex = activeArr.indexOf(activeBudget.id);
        const overIndex = overArr.indexOf(overBudget.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        const newHeaderArr = arrayMove(activeArr, activeIndex, overIndex);

        try {
            await headerApi.update(activeHeader.id, {
                arrBudget: newHeaderArr
            });
            toast.success("Budget order updated successfully");
            await loadData();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update budget order";
            toast.error(errorMessage);
        }
    };

    // Register Actual budget operations
    const handleRegisterActual = async (budget: Budget) => {
        setRegisteredBudgets([]);
        setIsRegisterActualConfirmOpen(true);

        const targetHeaders = headers.filter(h => h.type === budget.type && h.id !== budget.header);

        const registerActualPromises = targetHeaders.map(async (header) => {
            const existingBudgets = budgets.filter(b => b.header === header.id);
            const lastArrBudget = header.arrBudget || [];
            const existingCount = existingBudgets.length;

            const newBudgetName = `${budget.name} (Copy ${existingCount + 1})`;

            try {
                const newBudget = await budgetApi.create({
                    name: newBudgetName,
                    note: budget.note,
                    type: budget.type,
                    amount: budget.amount,
                    tags: budget.tags,
                    project: projectId,
                    header: header.id,
                    active: true
                });

                const newHeaderArr = [...lastArrBudget, newBudget.id];
                await headerApi.update(header.id, {
                    arrBudget: newHeaderArr
                });

                return newBudget;
            } catch (error: any) {
                const errorMessage = error?.response?.data?.error || "Failed to register actual";
                toast.error(errorMessage);
                return null;
            }
        });

        const registers = await Promise.all(registerActualPromises);
        setRegisteredBudgets(registers.filter((b): b is BudgetWithName => b !== null));
    };

    // Get budget count for a header
    const getBudgetCount = (headerId: string) => {
        return budgets.filter(b => b.header === headerId).length;
    };

    return {
        headers,
        budgets,
        actuals,
        isAddHeaderDialogOpen,
        setIsAddHeaderDialogOpen,
        isEditHeaderDialogOpen,
        setIsEditHeaderDialogOpen,
        isAddBudgetDialogOpen,
        setIsAddBudgetDialogOpen,
        isEditBudgetDialogOpen,
        setIsEditBudgetDialogOpen,
        isEditActualDialogOpen,
        setIsEditActualDialogOpen,
        isRegisterActualConfirmOpen,
        setIsRegisterActualConfirmOpen,
        headerForm,
        setHeaderForm,
        editHeaderForm,
        setEditHeaderForm,
        editBudgetForm,
        setEditBudgetForm,
        budgetForm,
        setBudgetForm,
        editActualForm,
        setEditActualForm,
        registeredBudgets,
        selectedHeaderId,
        setSelectedHeaderId,
        selectedBudgetIds,
        toggleBudgetSelection,
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
        handleDragEnd,
        handleRegisterActual,
        getBudgetCount,
        loadData
    };
};

export default useProjectBudgets;

interface HeaderForm {
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

interface EditHeaderForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

interface BudgetForm {
    name: string;
    note?: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
}
import { useState, useEffect } from "react";
import { headerApi, budgetApi, actualApi } from "@/services/api";
import { toast } from "react-hot-toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
}

interface ActualWithBudgetInfo extends Actual {
    budgetName: string;
    headerName: string;
    headerId: string;
    headerOrder: number;
    budgetType: 'income' | 'expense';
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

export function ProjectActuals({ projectId }: ProjectActualsProps) {
    const [actuals, setActuals] = useState<ActualWithBudgetInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditActualDialogOpen, setIsEditActualDialogOpen] = useState(false);
    const [editActualForm, setEditActualForm] = useState({
        id: '',
        name: '',
        amount: 0
    });

    const loadData = async () => {
        try {
            const [headersRes, budgetsRes, actualsRes] = await Promise.all([
                headerApi.getAllByProject(projectId),
                budgetApi.getAllByProject(projectId),
                actualApi.getAllByProject(projectId)
            ]);

            const headersData = Array.isArray(headersRes.data) ? headersRes.data : [];
            const budgetsData = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];

            const actualsData = Array.isArray(actualsRes.data) ? actualsRes.data : [];

            const actualsWithInfo: ActualWithBudgetInfo[] = actualsData.map((actual: any) => {
                const budget = budgetsData.find(b => b.id === actual.budget);
                const header = headersData.find(h => h.id === budget?.header);
                return {
                    ...actual,
                    budgetName: budget?.name || '',
                    headerName: header?.name || '',
                    headerId: header?.id || '',
                    headerOrder: header ? headersData.findIndex(h => h.id === header.id) : 0,
                    budgetType: budget?.type || 'expense'
                };
            });

            // Sort by header order, then budget order (based on header's arrBudget), then actuals by their order
            const sortedActuals = actualsWithInfo.sort((a, b) => {
                // First, sort by header order
                if (a.headerOrder !== b.headerOrder) {
                    return a.headerOrder - b.headerOrder;
                }

                // If same header, sort by budget order within the header
                const budgetOrderA = headersData.find(h => h.id === a.headerId)?.arrBudget?.indexOf(a.budget) ?? 0;
                const budgetOrderB = headersData.find(h => h.id === b.headerId)?.arrBudget?.indexOf(b.budget) ?? 0;
                if (budgetOrderA !== budgetOrderB) {
                    return budgetOrderA - budgetOrderB;
                }

                // If same budget, maintain the order they were fetched (by createdAt)
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            setActuals(sortedActuals);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load actuals";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

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

    const handleActualDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const activeIndex = actuals.findIndex((a) => a.id === active.id);
        const overIndex = actuals.findIndex((a) => a.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        setActuals((prev) => arrayMove(prev, activeIndex, overIndex));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Actuals</h2>
                    </div>
                </CardHeader>
                <CardContent>
                    <DndContext onDragEnd={handleActualDragEnd}>
                        <SortableContext items={actuals.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Budget / Actual Name</TableHead>
                                        <TableHead className="w-[10%]">Type</TableHead>
                                        <TableHead className="w-[15%] text-right">Amount</TableHead>
                                        <TableHead className="w-[25%]">Header</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {actuals.map((actual) => (
                                        <ActualSortableRow key={actual.id} id={actual.id} disabled={false}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-muted-foreground">{actual.budgetName}</span>
                                                    <span className="font-medium">{actual.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    actual.budgetType === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {getTypeLabel(actual.budgetType)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-medium">
                                                    {formatNumber(actual.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {actual.headerName}
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
                </CardContent>
            </Card>
        </div>
    );
}

export default ProjectActuals;
import { TableRow, TableCell } from "@/components/ui/table";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { Budget } from "../types";
import { Actual } from "../types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BudgetRowProps {
    budget: Budget;
    actuals?: Actual[];
    selected: boolean;
    onToggleSelect: () => void;
    onOpenEdit: (budget: Budget) => void;
    onOpenEditActual?: (actual: Actual) => void;
}

// Budget Row Sortable Item - wrapper for sortable functionality
function BudgetSortableRow({ id, children, disabled }: { id: string; children: React.ReactNode; disabled?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes} {...listeners} className={disabled ? '' : 'cursor-move'}>
            {children}
        </TableRow>
    );
}

// Budget Row component with actuals support
export function BudgetRow({ budget, actuals = [], selected, onToggleSelect, onOpenEdit, onOpenEditActual }: BudgetRowProps) {
    const totalActuals = actuals.length;

    if (totalActuals === 0) {
        return (
            <BudgetSortableRow key={budget.id} id={budget.id} disabled={false}>
                <TableCell className="px-2 text-left">
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selected}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onToggleSelect();
                        }}
                        onChange={() => {}}
                    />
                </TableCell>
                <TableCell className="w-[50%] px-2 text-left">
                    <div className="flex items-center gap-2">
                        <span
                            className="cursor-pointer hover:underline font-medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenEdit(budget);
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {budget.name}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="w-[12.5%] px-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                        budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {getTypeLabel(budget.type)}
                    </span>
                </TableCell>
                <TableCell className="w-[12.5%] text-right border-r border-green-300">
                    <span className="text-sm">{formatNumber(budget.amount)}</span>
                </TableCell>
                <TableCell className="w-[40%] text-left pl-8">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="w-[20%] text-right border-r border-green-300">
                    <span className="text-sm text-muted-foreground">—</span>
                </TableCell>
            </BudgetSortableRow>
        );
    }

    return (
        <>
            {actuals.map((actual, index) => (
                <BudgetSortableRow key={index === 0 ? budget.id : actual.id} id={index === 0 ? budget.id : actual.id} disabled={index !== 0}>
                    {index === 0 && (
                        <>
                            <TableCell rowSpan={totalActuals} className="px-2 text-left">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-primary"
                                    checked={selected}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        onToggleSelect();
                                    }}
                                    onChange={() => {}}
                                />
                            </TableCell>
                            <TableCell rowSpan={totalActuals} className="w-[50%] px-2 text-left">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="cursor-pointer hover:underline font-medium"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenEdit(budget);
                                        }}
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        {budget.name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell rowSpan={totalActuals} className="w-[12.5%] px-2 text-center">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    budget.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {getTypeLabel(budget.type)}
                                </span>
                            </TableCell>
                            <TableCell rowSpan={totalActuals} className="w-[12.5%] text-right border-r border-green-300">
                                <span className="text-sm">{formatNumber(budget.amount)}</span>
                            </TableCell>
                        </>
                    )}
                    <TableCell className={`w-[40%] text-left pl-8`}>
                        <span 
                            className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground hover:underline cursor-pointer" 
                            title={actual.name}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditActual?.(actual);
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {actual.name}
                        </span>
                    </TableCell>
                    <TableCell className="w-[20%] text-right border-r border-green-300">
                        <span className="text-sm">{formatNumber(actual.amount)}</span>
                    </TableCell>
                </BudgetSortableRow>
            ))}
        </>
    );
}
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatNumber, getTypeLabel } from "@/utils/formatters";
import { Header, Budget, Actual } from "../types";
import { toast } from "react-hot-toast";
import { BudgetRow as BudgetRowComponent } from "./BudgetRow";

interface HeaderRowProps {
    header: Header;
    associatedBudgets: Budget[];
    headerTotal: number;
    isExpanded: boolean;
    selectedBudgetIds: Set<string>;
    actuals: { [budgetId: string]: Actual[] };
    onToggleExpansion: (headerId: string) => void;
    onOpenEditHeader: (header: Header) => void;
    onAddBudget: (headerId: string) => void;
    onSaveBudgetPositions: (headerId: string) => void;
    onDeleteHeader: (headerId: string) => void;
    onOpenCloneConfirm: () => void;
    onOpenEditBudget: (budget: Budget) => void;
    onToggleSelectAllBudgets: (budgets: { id: string }[]) => void;
    onToggleSelectBudget: (budgetId: string) => void;
    onOpenEditActual: (actual: Actual) => void;
}



// Header row component
export function HeaderRow({
    header,
    associatedBudgets,
    headerTotal,
    isExpanded,
    selectedBudgetIds,
    actuals,
    onToggleExpansion,
    onOpenEditHeader,
    onAddBudget,
    onSaveBudgetPositions,
    onDeleteHeader,
    onOpenCloneConfirm,
    onOpenEditBudget,
    onToggleSelectAllBudgets,
    onToggleSelectBudget,
    onOpenEditActual,
    }: HeaderRowProps) {
    const someSelected = Array.from(selectedBudgetIds).some(id => associatedBudgets.some(b => b.id === id));

    return (
        <Card className="transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div
                    className={`cursor-move space-y-1 ${!isExpanded ? 'cursor-grab' : 'cursor-not-allowed'}`}
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
                                onToggleExpansion(header.id);
                            }}
                        >
                            {isExpanded ? (
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
                                onOpenEditHeader(header);
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
                        {someSelected && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                {Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id)).length} selected
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {someSelected && (
                        <DropdownMenu>
                            <Button size="sm" type="button" className="h-8 px-3">
                                {Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id)).length} selected
                            </Button>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onOpenCloneConfirm}>
                                    Clone
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const selectedInHeader = Array.from(selectedBudgetIds).filter(id => associatedBudgets.some(b => b.id === id));
                                    toast.success("Register action would register " + selectedInHeader.length + " budgets in this header");
                                }}>
                                    Register
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    toast("Clone to transaction would create transactions for selected actuals");
                                }}>
                                    Clone to Transaction
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAddBudget(header.id)}
                        title="Add budget"
                    >
                        +
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSaveBudgetPositions(header.id)}
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
                        onClick={() => onDeleteHeader(header.id)}
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
            <CardContent className={!isExpanded ? 'p-0' : ''}>
                {!isExpanded ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                        Click chevron to show budgets
                    </div>
                ) : (
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
                                            onToggleSelectAllBudgets(associatedBudgets);
                                        }}
                                        onChange={() => {}}
                                    />
                                </TableHead>
                                <TableHead className="w-[50%] px-2 text-left">Name</TableHead>
                                <TableHead className="w-[12.5%] px-2 text-center">t</TableHead>
                                <TableHead className="text-right w-[12.5%] border-r border-green-300">Amount</TableHead>
                                <TableHead className="text-left w-[40%]">actName</TableHead>
                                <TableHead className="text-right w-[20%]">actAmount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {associatedBudgets.map((budget) => (
                                <BudgetRowComponent
                                    key={budget.id}
                                    budget={budget}
                                    actuals={actuals[budget.id] || []}
                                    selected={selectedBudgetIds.has(budget.id)}
                                    onToggleSelect={() => onToggleSelectBudget(budget.id)}
                                    onOpenEdit={onOpenEditBudget}
                                    onOpenEditActual={onOpenEditActual}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
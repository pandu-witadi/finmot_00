import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/utils/formatters";
import { Header } from "./useBudgetHeaders";

interface BudgetAddDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    headers: Header[];
    selectedHeaderId: string | null;
    budgetForm: {
        name: string;
        note?: string;
        type: 'income' | 'expense';
        amount: number;
        tags: string;
    };
    setBudgetForm: React.Dispatch<React.SetStateAction<{
        name: string;
        note?: string;
        type: 'income' | 'expense';
        amount: number;
        tags: string;
    }>>;
    onSelectHeader: (headerId: string | null) => void;
    onAddBudget: () => void;
}

export function BudgetAddDialog({
    isOpen,
    onOpenChange,
    headers,
    selectedHeaderId,
    budgetForm,
    setBudgetForm,
    onSelectHeader: _onSelectHeader,
    onAddBudget,
}: BudgetAddDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Budget</DialogTitle>
                    <DialogDescription>
                        Add a new budget item under {headers.find(h => h.id === selectedHeaderId)?.name || 'the selected header'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="budgetName">Name</Label>
                        <Input
                            id="budgetName"
                            value={budgetForm.name}
                            onChange={e => setBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter budget name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={budgetForm.type === 'income' ? 'default' : 'outline'}
                                onClick={() => setBudgetForm(prev => ({ ...prev, type: 'income' }))}
                                className={`flex-1 h-9 text-xs ${budgetForm.type === 'income' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'text-green-600 hover:text-green-700'}`}
                            >
                                Income
                            </Button>
                            <Button
                                type="button"
                                variant={budgetForm.type === 'expense' ? 'default' : 'outline'}
                                onClick={() => setBudgetForm(prev => ({ ...prev, type: 'expense' }))}
                                className={`flex-1 h-9 text-xs ${budgetForm.type === 'expense' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'text-red-600 hover:text-red-700'}`}
                            >
                                Expense
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budgetAmount">Amount</Label>
                        <Input
                            id="budgetAmount"
                            type="text"
                            value={formatNumber(budgetForm.amount)}
                            onChange={e => {
                                const rawValue = e.target.value.replace(/\./g, '');
                                setBudgetForm(prev => ({ ...prev, amount: parseFloat(rawValue) || 0 }));
                            }}
                            placeholder="0"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budgetTags">Tags (comma-separated)</Label>
                        <Input
                            id="budgetTags"
                            value={budgetForm.tags}
                            onChange={e => setBudgetForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budgetNote">Note</Label>
                        <textarea
                            id="budgetNote"
                            value={budgetForm.note}
                            onChange={e => setBudgetForm(prev => ({ ...prev, note: e.target.value }))}
                            className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 resize-none"
                            placeholder="Enter note"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onAddBudget}>
                        Add Budget
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
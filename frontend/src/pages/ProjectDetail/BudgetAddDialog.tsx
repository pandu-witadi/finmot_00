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
        type: 'income' | 'expense';
        amount: number;
        tags: string;
    };
    setBudgetForm: React.Dispatch<React.SetStateAction<{
        name: string;
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="budgetType">Type</Label>
                            <select
                                id="budgetType"
                                value={budgetForm.type}
                                onChange={e => setBudgetForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="income">in</option>
                                <option value="expense">ex</option>
                            </select>
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
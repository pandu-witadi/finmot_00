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

interface EditBudgetForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    tags: string;
}

interface BudgetEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editBudgetForm: EditBudgetForm;
    setEditBudgetForm: React.Dispatch<React.SetStateAction<EditBudgetForm>>;
    onEditBudget: () => void;
    onDeleteBudget?: () => void;
    hasActuals: boolean;
}

export function BudgetEditDialog({
    isOpen,
    onOpenChange,
    editBudgetForm,
    setEditBudgetForm,
    onEditBudget,
    onDeleteBudget,
    hasActuals,
}: BudgetEditDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>
                        {hasActuals 
                            ? 'Edit the budget name, type, amount, and tags. This budget has actual records and cannot be deleted.'
                            : 'Edit the budget name, type, amount, and tags. You can delete this budget since it has no actual records.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="editBudgetName">Name</Label>
                        <Input
                            id="editBudgetName"
                            value={editBudgetForm.name}
                            onChange={e => setEditBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter budget name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editBudgetType">Type</Label>
                            <select
                                id="editBudgetType"
                                value={editBudgetForm.type}
                                onChange={e => setEditBudgetForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="income">in</option>
                                <option value="expense">ex</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editBudgetAmount">Amount</Label>
                            <Input
                                id="editBudgetAmount"
                                type="text"
                                value={formatNumber(editBudgetForm.amount)}
                                onChange={e => {
                                    const rawValue = e.target.value.replace(/\./g, '');
                                    setEditBudgetForm(prev => ({ ...prev, amount: parseFloat(rawValue) || 0 }));
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="editBudgetTags">Tags (comma-separated)</Label>
                        <Input
                            id="editBudgetTags"
                            value={editBudgetForm.tags}
                            onChange={e => setEditBudgetForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    {!hasActuals && onDeleteBudget && (
                        <Button variant="destructive" onClick={onDeleteBudget}>
                            Delete
                        </Button>
                    )}
                    <Button onClick={onEditBudget}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
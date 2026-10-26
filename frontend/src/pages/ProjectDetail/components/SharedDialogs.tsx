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
import { Header } from "../types";
import { Budget } from "../types";

// Generic Add/Edit form component
function FormRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
        </div>
    );
}

function TypeSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
    return (
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        >
            <option value="income">in</option>
            <option value="expense">ex</option>
        </select>
    );
}

function AmountInput({ id, value, onChange }: { id: string; value: number; onChange: (v: string) => void }) {
    return (
        <Input
            id={id}
            type="text"
            value={formatNumber(value)}
            onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, '');
                onChange(rawValue);
            }}
            placeholder="0"
        />
    );
}

// Header Add Dialog
interface HeaderAddDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    headerForm: { name: string; type: 'income' | 'expense'; tags: string };
    setHeaderForm: React.Dispatch<React.SetStateAction<{ name: string; type: 'income' | 'expense'; tags: string }>>;
    onAddHeader: () => void;
}

export function HeaderAddDialog({ isOpen, onOpenChange, headerForm, setHeaderForm, onAddHeader }: HeaderAddDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Header</DialogTitle>
                    <DialogDescription>
                        Create a new header to organize your project budgets
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <FormRow label="Name" htmlFor="headerName">
                        <Input
                            id="headerName"
                            value={headerForm.name}
                            onChange={e => setHeaderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter header name"
                        />
                    </FormRow>
                    <div className="grid grid-cols-2 gap-4">
                        <FormRow label="Type" htmlFor="headerType">
                            <TypeSelect
                                id="headerType"
                                value={headerForm.type}
                                onChange={(v) => setHeaderForm(prev => ({ ...prev, type: v as 'income' | 'expense' }))}
                            />
                        </FormRow>
                    </div>
                    <FormRow label="Tags (comma-separated)" htmlFor="headerTags">
                        <Input
                            id="headerTags"
                            value={headerForm.tags}
                            onChange={e => setHeaderForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                        />
                    </FormRow>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onAddHeader}>Add Header</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Header Edit Dialog
interface HeaderEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editHeaderForm: { id: string; name: string; type: 'income' | 'expense'; tags: string };
    setEditHeaderForm: React.Dispatch<React.SetStateAction<{ id: string; name: string; type: 'income' | 'expense'; tags: string }>>;
    onEditHeader: () => void;
}

export function HeaderEditDialog({ isOpen, onOpenChange, editHeaderForm, setEditHeaderForm, onEditHeader }: HeaderEditDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Header</DialogTitle>
                    <DialogDescription>
                        Edit the header name, type, and tags
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <FormRow label="Name" htmlFor="editHeaderName">
                        <Input
                            id="editHeaderName"
                            value={editHeaderForm.name}
                            onChange={e => setEditHeaderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter header name"
                        />
                    </FormRow>
                    <div className="grid grid-cols-2 gap-4">
                        <FormRow label="Type" htmlFor="editHeaderType">
                            <TypeSelect
                                id="editHeaderType"
                                value={editHeaderForm.type}
                                onChange={(v) => setEditHeaderForm(prev => ({ ...prev, type: v as 'income' | 'expense' }))}
                            />
                        </FormRow>
                    </div>
                    <FormRow label="Tags (comma-separated)" htmlFor="editHeaderTags">
                        <Input
                            id="editHeaderTags"
                            value={editHeaderForm.tags}
                            onChange={e => setEditHeaderForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </FormRow>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onEditHeader}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Budget Add Dialog
interface BudgetAddDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    headers: Header[];
    selectedHeaderId: string | null;
    budgetForm: { name: string; type: 'income' | 'expense'; amount: number; tags: string };
    setBudgetForm: React.Dispatch<React.SetStateAction<{ name: string; type: 'income' | 'expense'; amount: number; tags: string }>>;
    onSelectHeader: (headerId: string | null) => void;
    onAddBudget: () => void;
}

export function BudgetAddDialog({ isOpen, onOpenChange, headers, selectedHeaderId, budgetForm, setBudgetForm, onSelectHeader, onAddBudget }: BudgetAddDialogProps) {
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
                    <FormRow label="Name" htmlFor="budgetName">
                        <Input
                            id="budgetName"
                            value={budgetForm.name}
                            onChange={e => setBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter budget name"
                        />
                    </FormRow>
                    <div className="grid grid-cols-2 gap-4">
                        <FormRow label="Type" htmlFor="budgetType">
                            <TypeSelect
                                id="budgetType"
                                value={budgetForm.type}
                                onChange={(v) => setBudgetForm(prev => ({ ...prev, type: v as 'income' | 'expense' }))}
                            />
                        </FormRow>
                        <FormRow label="Amount" htmlFor="budgetAmount">
                            <AmountInput
                                id="budgetAmount"
                                value={budgetForm.amount}
                                onChange={(v) => setBudgetForm(prev => ({ ...prev, amount: parseFloat(v) || 0 }))}
                            />
                        </FormRow>
                    </div>
                    <FormRow label="Tags (comma-separated)" htmlFor="budgetTags">
                        <Input
                            id="budgetTags"
                            value={budgetForm.tags}
                            onChange={e => setBudgetForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </FormRow>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onAddBudget}>Add Budget</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Budget Edit Dialog
interface BudgetEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editBudgetForm: { id: string; name: string; type: 'income' | 'expense'; amount: number; tags: string };
    setEditBudgetForm: React.Dispatch<React.SetStateAction<{ id: string; name: string; type: 'income' | 'expense'; amount: number; tags: string }>>;
    onEditBudget: () => void;
    onDeleteBudget?: () => void;
    hasActuals: boolean;
}

export function BudgetEditDialog({ isOpen, onOpenChange, editBudgetForm, setEditBudgetForm, onEditBudget, onDeleteBudget, hasActuals }: BudgetEditDialogProps) {
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
                    <FormRow label="Name" htmlFor="editBudgetName">
                        <Input
                            id="editBudgetName"
                            value={editBudgetForm.name}
                            onChange={e => setEditBudgetForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter budget name"
                        />
                    </FormRow>
                    <div className="grid grid-cols-2 gap-4">
                        <FormRow label="Type" htmlFor="editBudgetType">
                            <TypeSelect
                                id="editBudgetType"
                                value={editBudgetForm.type}
                                onChange={(v) => setEditBudgetForm(prev => ({ ...prev, type: v as 'income' | 'expense' }))}
                            />
                        </FormRow>
                        <FormRow label="Amount" htmlFor="editBudgetAmount">
                            <AmountInput
                                id="editBudgetAmount"
                                value={editBudgetForm.amount}
                                onChange={(v) => setEditBudgetForm(prev => ({ ...prev, amount: parseFloat(v) || 0 }))}
                            />
                        </FormRow>
                    </div>
                    <FormRow label="Tags (comma-separated)" htmlFor="editBudgetTags">
                        <Input
                            id="editBudgetTags"
                            value={editBudgetForm.tags}
                            onChange={e => setEditBudgetForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </FormRow>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    {!hasActuals && onDeleteBudget && (
                        <Button variant="destructive" onClick={onDeleteBudget}>Delete</Button>
                    )}
                    <Button onClick={onEditBudget}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Actual Edit Dialog
interface ActualEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editActualForm: { id: string; name: string; amount: number };
    setEditActualForm: React.Dispatch<React.SetStateAction<{ id: string; name: string; amount: number }>>;
    onEditActual: () => void;
    onDeleteActual?: () => void;
}

export function ActualEditDialog({ isOpen, onOpenChange, editActualForm, setEditActualForm, onEditActual, onDeleteActual }: ActualEditDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Actual</DialogTitle>
                    <DialogDescription>
                        Edit the actual name and amount
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <FormRow label="Name" htmlFor="editActualName">
                        <Input
                            id="editActualName"
                            value={editActualForm.name}
                            onChange={e => setEditActualForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter actual name"
                        />
                    </FormRow>
                    <FormRow label="Amount" htmlFor="editActualAmount">
                        <AmountInput
                            id="editActualAmount"
                            value={editActualForm.amount}
                            onChange={(v) => setEditActualForm(prev => ({ ...prev, amount: parseFloat(v) || 0 }))}
                        />
                    </FormRow>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    {onDeleteActual && (
                        <Button variant="destructive" onClick={onDeleteActual}>Delete</Button>
                    )}
                    <Button onClick={onEditActual}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Clone Confirm Dialog
interface CloneConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    clonedBudgets: { budget: Budget; name: string }[];
    onConfirm: () => void;
}

export function CloneConfirmDialog({ isOpen, onOpenChange, clonedBudgets, onConfirm }: CloneConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clone Budget to Actual</DialogTitle>
                    <DialogDescription>
                        This will create Actual records for {clonedBudgets.length} selected budget(s). Each Actual will copy the name, type, amount, and tags from the Budget.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-2">
                        {clonedBudgets.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {item.budget.type === 'income' ? 'Income' : 'Expense'} - {formatNumber(item.budget.amount)}
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                    <path d="m12 3 1.912 5.513a2 2 0 0 0 2.549 1.532l5.508-.918a2 2 0 0 1 2.49 2.49l-.918 5.508a2 2 0 0 0 1.532 2.549l5.513 1.912a2 2 0 0 1 0 3.824l-5.513 1.912a2 2 0 0 0-1.532 2.549l.918 5.508a2 2 0 0 1-2.49 2.49l-5.508-.918a2 2 0 0 0-2.549 1.532l-1.912 5.513a2 2 0 0 1-3.824 0l-1.912-5.513a2 2 0 0 0-2.549-1.532l-5.508.918a2 2 0 0 1-2.49-2.49l.918-5.508a2 2 0 0 0-1.532-2.549l-5.513-1.912a2 2 0 0 1 0-3.824l5.513-1.912a2 2 0 0 0 1.532-2.549l-.918-5.508a2 2 0 0 1 2.49-2.49l5.508.918a2 2 0 0 0 2.549-1.532L12 3Z"/>
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onConfirm}>
                        Clone {clonedBudgets.length} budget{clonedBudgets.length !== 1 ? 's' : ''}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
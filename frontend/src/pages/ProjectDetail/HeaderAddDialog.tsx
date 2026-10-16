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

interface HeaderForm {
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

interface HeaderAddDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    headerForm: HeaderForm;
    setHeaderForm: React.Dispatch<React.SetStateAction<HeaderForm>>;
    onAddHeader: () => void;
}

export function HeaderAddDialog({
    isOpen,
    onOpenChange,
    headerForm,
    setHeaderForm,
    onAddHeader,
}: HeaderAddDialogProps) {
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
                    <div className="grid gap-2">
                        <Label htmlFor="headerName">Name</Label>
                        <Input
                            id="headerName"
                            value={headerForm.name}
                            onChange={e => setHeaderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter header name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="headerType">Type</Label>
                            <select
                                id="headerType"
                                value={headerForm.type}
                                onChange={e => setHeaderForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="income">in</option>
                                <option value="expense">ex</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="headerTags">Tags (comma-separated)</Label>
                        <Input
                            id="headerTags"
                            value={headerForm.tags}
                            onChange={e => setHeaderForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onAddHeader}>
                        Add Header
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
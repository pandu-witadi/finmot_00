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

interface EditHeaderForm {
    id: string;
    name: string;
    type: 'income' | 'expense';
    tags: string;
}

interface HeaderEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editHeaderForm: EditHeaderForm;
    setEditHeaderForm: React.Dispatch<React.SetStateAction<EditHeaderForm>>;
    onEditHeader: () => void;
}

export function HeaderEditDialog({
    isOpen,
    onOpenChange,
    editHeaderForm,
    setEditHeaderForm,
    onEditHeader,
}: HeaderEditDialogProps) {
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
                    <div className="grid gap-2">
                        <Label htmlFor="editHeaderName">Name</Label>
                        <Input
                            id="editHeaderName"
                            value={editHeaderForm.name}
                            onChange={e => setEditHeaderForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter header name"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editHeaderType">Type</Label>
                            <select
                                id="editHeaderType"
                                value={editHeaderForm.type}
                                onChange={e => setEditHeaderForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="income">in</option>
                                <option value="expense">ex</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="editHeaderTags">Tags (comma-separated)</Label>
                        <Input
                            id="editHeaderTags"
                            value={editHeaderForm.tags}
                            onChange={e => setEditHeaderForm(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onEditHeader}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
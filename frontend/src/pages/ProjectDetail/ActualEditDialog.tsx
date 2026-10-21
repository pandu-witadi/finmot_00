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

interface EditActualForm {
    id: string;
    name: string;
    amount: number;
}

interface ActualEditDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editActualForm: EditActualForm;
    setEditActualForm: React.Dispatch<React.SetStateAction<EditActualForm>>;
    onEditActual: () => void;
    onDeleteActual?: () => void;
}

export function ActualEditDialog({
    isOpen,
    onOpenChange,
    editActualForm,
    setEditActualForm,
    onEditActual,
    onDeleteActual,
}: ActualEditDialogProps) {
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
                    <div className="grid gap-2">
                        <Label htmlFor="editActualName">Name</Label>
                        <Input
                            id="editActualName"
                            value={editActualForm.name}
                            onChange={e => setEditActualForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter actual name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="editActualAmount">Amount</Label>
                        <Input
                            id="editActualAmount"
                            type="text"
                            value={formatNumber(editActualForm.amount)}
                            onChange={e => {
                                const rawValue = e.target.value.replace(/\./g, '');
                                setEditActualForm(prev => ({ ...prev, amount: parseFloat(rawValue) || 0 }));
                            }}
                            placeholder="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    {onDeleteActual && (
                        <Button variant="destructive" onClick={onDeleteActual}>
                            Delete
                        </Button>
                    )}
                    <Button onClick={onEditActual}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
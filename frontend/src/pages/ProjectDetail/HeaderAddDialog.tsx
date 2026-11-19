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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
                    <div className="grid gap-2">
                            <Label htmlFor="headerType">Type</Label>
                            <RadioGroup
                                id="headerType"
                                value={headerForm.type}
                                onValueChange={(value) => setHeaderForm(prev => ({ ...prev, type: value as 'income' | 'expense' }))}
                                className="flex gap-6 w-fit"
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="income" id="headerType-income" />
                                    <Label htmlFor="headerType-income" className="text-green-700 font-medium">Income</Label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value="expense" id="headerType-expense" />
                                    <Label htmlFor="headerType-expense" className="text-red-400 font-medium">Expense</Label>
                                </div>
                            </RadioGroup>
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
                    <Button onClick={onAddHeader} className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm">
                        + header
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
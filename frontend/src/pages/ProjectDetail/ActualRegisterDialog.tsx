import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/utils/formatters";
import { useState, useEffect } from "react";
import { Budget } from "./types";

interface ActualRegisterDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    budget: Budget;
    onRegisterActual: (data: {
        budgetId: string;
        actualName: string;
        exDate: Date;
        updatedBy: string;
        actualAmount?: number;
        actualType?: 'income' | 'expense';
        actualTags?: string[];
    }) => Promise<void>;
}

export function ActualRegisterDialog({
    isOpen,
    onOpenChange,
    budget,
    onRegisterActual,
}: ActualRegisterDialogProps) {
    const [actualName, setActualName] = useState('');
    const [actualAmount, setActualAmount] = useState(0);
    const [actualType, setActualType] = useState<'income' | 'expense'>(budget.type);
    const [actualTags, setActualTags] = useState('');
    const [exDate, setExDate] = useState<Date>(new Date());

    useEffect(() => {
        if (isOpen) {
            setActualName(budget.name);
            setActualAmount(budget.amount);
            setActualType(budget.type);
            setActualTags(budget.tags.join(', '));
            setExDate(new Date());
        }
    }, [isOpen, budget]);

    const handleRegister = async () => {
        await onRegisterActual({
            budgetId: budget.id,
            actualName: actualName.trim() || budget.name,
            exDate: exDate,
            updatedBy: 'user123',
            actualAmount: actualAmount,
            actualType: actualType,
            actualTags: actualTags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
        });
        
        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Register Actual</DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="registerActualName">Name</Label>
                        <Input
                            id="registerActualName"
                            value={actualName}
                            onChange={e => setActualName(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="registerActualAmount">Amount</Label>
                        <Input
                            id="registerActualAmount"
                            type="text"
                            value={formatNumber(actualAmount)}
                            onChange={e => {
                                const rawValue = e.target.value.replace(/\./g, '');
                                setActualAmount(parseFloat(rawValue) || 0);
                            }}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                        <Label htmlFor="registerActualType">Type</Label>
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm ${actualType === 'income' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>Income</span>
                            <Switch
                                id="registerActualType"
                                checked={actualType === 'expense'}
                                onCheckedChange={(checked) => setActualType(checked ? 'expense' : 'income')}
                            />
                            <span className={`text-sm ${actualType === 'expense' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>Expense</span>
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="registerActualTags">Tags (comma-separated)</Label>
                        <Input
                            id="registerActualTags"
                            value={actualTags}
                            onChange={e => setActualTags(e.target.value)}
                            placeholder="tag1, tag2"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="registerActualExDate">Execution Date</Label>
                        <Input
                            id="registerActualExDate"
                            type="date"
                            value={exDate.toISOString().split('T')[0]}
                            onChange={e => setExDate(new Date(e.target.value))}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleRegister}>
                        Register Actual
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
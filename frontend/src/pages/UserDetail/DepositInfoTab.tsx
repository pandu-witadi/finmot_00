import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DepositInfoState, DepositInfoActions } from "./useDepositInfo";

interface DepositInfoTabProps {
    isLoading: boolean;
    state: DepositInfoState;
    actions: DepositInfoActions;
    handleDepositInfoSave: (e: React.FormEvent) => void;
}

export function DepositInfoTab({ isLoading, state, actions, handleDepositInfoSave }: DepositInfoTabProps) {
    const { deposits, newDeposit, depositErrors, isEditing, editDepositData } = state;
    const {
        getDepositDateValue,
        handleDepositChange,
        addDeposit,
        removeDeposit,
        editDeposit,
        saveDeposit,
        calculateTotalDeposit,
    } = actions;

    const formatDate = (date: string | Date | undefined): string => {
        if (!date) return "-";
        const d = new Date(date);
        return format(d, "yyyy-MM-dd");
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Deposit</span>
                    <span className={`text-xl font-bold ${calculateTotalDeposit() >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(calculateTotalDeposit()).toLocaleString("en-US", { style: "decimal" })}
                    </span>
                </div>
            </div>

            <div className="rounded-md border">
                <div className="grid grid-cols-13 gap-2 bg-muted p-3 text-xs font-semibold">
                    <div className="col-span-1 text-center">No</div>
                    <div className="col-span-1 text-center">Sign</div>
                    <div className="col-span-3 text-right">Amount</div>
                    <div className="col-span-2 text-right">Date</div>
                    <div className="col-span-4">Note</div>
                    <div className="col-span-2 text-center">Actions</div>
                </div>
                {deposits.length > 0 ? (
                    <div className="divide-y">
                        {deposits.map((deposit, index) => (
                            <div key={index} className="grid grid-cols-13 gap-2 p-3 text-sm items-center">
                                <div className="col-span-1 flex items-center justify-center font-medium text-muted-foreground">
                                    {index + 1}
                                </div>
                                <div className={`col-span-1 flex items-center justify-center font-bold ${deposit.sign === "+" ? "text-green-600" : "text-red-600"}`}>
                                    {deposit.sign}
                                </div>
                                <div className="col-span-3 font-medium text-right">
                                    {(deposit.amount || 0).toLocaleString("en-US", { style: "decimal" })}
                                </div>
                                <div className="col-span-2 text-right text-muted-foreground">
                                    {formatDate(deposit.date)}
                                </div>
                                <div className="col-span-4 text-muted-foreground truncate" title={deposit.note || ""}>
                                    {deposit.note || "-"}
                                </div>
                                <div className="col-span-2 flex items-center justify-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editDeposit(index)}
                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                        title="Edit deposit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                            <path d="m15 5 4 4" />
                                        </svg>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDeposit(index)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        title="Delete deposit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground italic">
                        No deposit entries yet
                    </div>
                )}
            </div>

            <Label>Add New Deposit Entry</Label>
            <div className="rounded-md border p-4 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-1 space-y-2">
                        <Label htmlFor="depositSign" className="text-xs">Sign</Label>
                        <select
                            id="depositSign"
                            name="sign"
                            value={(isEditing ? editDepositData : newDeposit).sign}
                            onChange={handleDepositChange}
                            className={`h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:border-ring focus:ring-3 focus:ring-ring/50 outline-none ${depositErrors.sign ? "border-red-500" : ""}`}
                        >
                            <option value="+">+</option>
                            <option value="-">-</option>
                        </select>
                        {depositErrors.sign && <p className="text-xs text-red-500">{depositErrors.sign}</p>}
                    </div>
                    <div className="col-span-3 space-y-2">
                        <Label htmlFor="depositAmount" className="text-xs">Amount</Label>
                        <Input
                            id="depositAmount"
                            name="amount"
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={isEditing ? editDepositData.amount : newDeposit.amount}
                            onChange={handleDepositChange}
                            className={depositErrors.amount ? "border-red-500" : ""}
                        />
                        {depositErrors.amount && <p className="text-xs text-red-500">{depositErrors.amount}</p>}
                    </div>
                    <div className="col-span-4 space-y-2">
                        <Label htmlFor="depositDate" className="text-xs">Date</Label>
                        <Input
                            id="depositDate"
                            name="date"
                            type="date"
                            value={getDepositDateValue()}
                            onChange={handleDepositChange}
                            className={depositErrors.date ? "border-red-500" : ""}
                        />
                        {depositErrors.date && <p className="text-xs text-red-500">{String(depositErrors.date)}</p>}
                    </div>
                    <div className="col-span-4 space-y-2">
                        <Label htmlFor="depositNote" className="text-xs">Note (optional)</Label>
                        <Input
                            id="depositNote"
                            name="note"
                            type="text"
                            placeholder="Deposit note"
                            value={isEditing ? editDepositData.note : newDeposit.note}
                            onChange={handleDepositChange}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addDeposit} className="flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        Add Deposit
                    </Button>
                    {isEditing && (
                        <Button type="button" variant="secondary" size="sm" onClick={saveDeposit}>
                            Update Deposit
                        </Button>
                    )}
                </div>
            </div>

            <div className="pt-6">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleDepositInfoSave}
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
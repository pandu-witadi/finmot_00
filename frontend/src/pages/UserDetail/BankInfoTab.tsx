import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BankAccount, BankInfoState, BankInfoActions } from "./useBankInfo";

interface BankInfoTabProps {
    formData: any;
    isLoading: boolean;
    state: BankInfoState;
    actions: BankInfoActions;
    handleBankInfoSave: (e: React.FormEvent) => void;
}

export function BankInfoTab({ formData, isLoading, state, actions, handleBankInfoSave }: BankInfoTabProps) {
    const { bankAccount, bankErrors, isEditingBank, editingBankIndex, editBankInfoData } = state;
    const { 
        handleBankChange, 
        removeBankInfo, 
        editBankInfo, 
        cancelEditBank, 
        saveBankInfo
    } = actions;

    const getBankAccountValue = (field: keyof BankAccount) => {
        return isEditingBank ? editBankInfoData[field] : bankAccount[field];
    };

    return (
        <div className="space-y-4">
            {formData.bankInfo && formData.bankInfo.length > 0 && (
                <div className="rounded-md border">
                    <div className="grid grid-cols-9 gap-2 bg-muted p-3 text-xs font-semibold">
                        <div className="col-span-1 flex items-center justify-center">No</div>
                        <div className="col-span-2">Bank Name</div>
                        <div className="col-span-2">Account No</div>
                        <div className="col-span-2">Account Holder</div>
                        <div className="col-span-1 flex items-center justify-center">Bank Code</div>
                        <div className="col-span-1 flex items-center justify-center">Actions</div>
                    </div>
                    <div className="divide-y">
                        {formData.bankInfo.map((bank: any, index: number) => (
                            <div key={index} className="grid grid-cols-9 gap-2 p-3 text-sm items-center">
                                <div className="col-span-1 flex items-center justify-center font-medium text-muted-foreground">
                                    {index + 1}
                                </div>
                                <div className="col-span-2 font-medium">{bank.bank}</div>
                                <div className="col-span-2 text-muted-foreground">{bank.accountNo}</div>
                                <div className="col-span-2 text-muted-foreground">{bank.name}</div>
                                <div className="col-span-1 flex items-center justify-center text-muted-foreground">{bank.code}</div>
                                <div className="col-span-1 flex items-center justify-center">
                                    {isEditingBank && editingBankIndex === index ? (
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={saveBankInfo}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                title="Save bank info"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                                                    <path d="M20 6 9 17l-5-5" />
                                                </svg>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEditBank}
                                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                title="Cancel edit"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                                                    <path d="M18 6 6 18" />
                                                    <path d="m6 6 12 12" />
                                                </svg>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => editBankInfo(index)}
                                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                title="Edit bank info"
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
                                                onClick={() => removeBankInfo(index)}
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                title="Delete bank info"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                </svg>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Label>{isEditingBank ? "Edit Bank Account" : "Add New Bank Account"}</Label>
            <div className="rounded-md border p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="bank" className="text-xs">Bank Name</Label>
                        <Input
                            id="bank"
                            name="bank"
                            placeholder="Bank Name"
                            value={getBankAccountValue("bank")}
                            onChange={handleBankChange}
                            className={bankErrors.bank ? "border-red-500" : ""}
                        />
                        {bankErrors.bank && <p className="text-xs text-red-500">{bankErrors.bank}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs">Bank Code</Label>
                        <Input
                            id="code"
                            name="code"
                            placeholder="Code"
                            value={getBankAccountValue("code")}
                            onChange={handleBankChange}
                            className={bankErrors.code ? "border-red-500" : ""}
                        />
                        {bankErrors.code && <p className="text-xs text-red-500">{bankErrors.code}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="accountNo" className="text-xs">Account No</Label>
                        <Input
                            id="accountNo"
                            name="accountNo"
                            placeholder="Account Number"
                            value={getBankAccountValue("accountNo")}
                            onChange={handleBankChange}
                            className={bankErrors.accountNo ? "border-red-500" : ""}
                        />
                        {bankErrors.accountNo && <p className="text-xs text-red-500">{bankErrors.accountNo}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accountName" className="text-xs">Account Holder</Label>
                        <Input
                            id="accountName"
                            name="name"
                            placeholder="Account Holder Name"
                            value={getBankAccountValue("name")}
                            onChange={handleBankChange}
                            className={bankErrors.name ? "border-red-500" : ""}
                        />
                        {bankErrors.name && <p className="text-xs text-red-500">{bankErrors.name}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={saveBankInfo} className="flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        {isEditingBank ? "Update Bank Account" : "Add Bank Account"}
                    </Button>
                    {isEditingBank && (
                        <Button type="button" variant="secondary" size="sm" onClick={cancelEditBank}>
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <div className="pt-6">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleBankInfoSave}
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}
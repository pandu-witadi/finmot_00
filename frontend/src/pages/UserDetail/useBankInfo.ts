import { useState } from "react";
import { z } from "zod";
import { bankInfoSchema } from "./schemas";

export interface BankAccount {
    bank: string;
    code: string;
    accountNo: string;
    name: string;
}

export interface BankInfoState {
    bankAccount: BankAccount;
    deposits: any[];
    bankErrors: Record<string, string>;
    isEditingBank: boolean;
    editingBankIndex: number | null;
    editBankInfoData: BankAccount;
}

export interface BankInfoActions {
    handleBankChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    addBankInfo: () => void;
    removeBankInfo: (index: number) => void;
    editBankInfo: (index: number) => void;
    cancelEditBank: () => void;
    saveBankInfo: () => void;
    setBankAccount: React.Dispatch<React.SetStateAction<BankAccount>>;
    setBankErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setIsEditingBank: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingBankIndex: React.Dispatch<React.SetStateAction<number | null>>;
    setEditBankInfoData: React.Dispatch<React.SetStateAction<BankAccount>>;
}

export function useBankInfo(
    formData: any,
    setFormData: React.Dispatch<React.SetStateAction<any>>
): [BankInfoState, BankInfoActions] {
    const [bankAccount, setBankAccount] = useState<BankAccount>({
        bank: "",
        code: "",
        accountNo: "",
        name: "",
    });
    const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
    const [editBankInfoData, setEditBankInfoData] = useState<BankAccount>({
        bank: "",
        code: "",
        accountNo: "",
        name: "",
    });

    const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (isEditingBank) {
            setEditBankInfoData(prev => ({ ...prev, [name]: value }));
        } else {
            setBankAccount(prev => ({ ...prev, [name]: value }));
        }
        if (bankErrors[name as keyof BankAccount]) {
            setBankErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof BankAccount];
                return newErrors;
            });
        }
    };

    const addBankInfo = () => {
        try {
            bankInfoSchema.parse(bankAccount);
            setBankErrors({});
            setFormData((prev: any) => {
                const newBankInfo = [...(prev.bankInfo || []), bankAccount];
                return {
                    ...prev,
                    bankInfo: newBankInfo,
                };
            });
            setBankAccount({ bank: "", code: "", accountNo: "", name: "" });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.issues.forEach((err: any) => {
                    if (err.path && err.path.length > 0) {
                        fieldErrors[err.path[0]] = err.message;
                    }
                });
                setBankErrors(fieldErrors);
            }
        }
    };

    const removeBankInfo = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            bankInfo: prev.bankInfo?.filter((_: any, i: number) => i !== index),
        }));
    };

    const editBankInfo = (index: number) => {
        const bankToEdit = formData.bankInfo?.[index];
        setEditBankInfoData({
            bank: bankToEdit?.bank || "",
            code: bankToEdit?.code || "",
            accountNo: bankToEdit?.accountNo || "",
            name: bankToEdit?.name || "",
        });
        setEditingBankIndex(index);
        setIsEditingBank(true);
    };

    const cancelEditBank = () => {
        setEditBankInfoData({ bank: "", code: "", accountNo: "", name: "" });
        setEditingBankIndex(null);
        setIsEditingBank(false);
        setBankErrors({});
    };

    const saveBankInfo = () => {
        try {
            const bankData = isEditingBank ? editBankInfoData : bankAccount;
            bankInfoSchema.parse(bankData);
            setBankErrors({});

            if (isEditingBank && editingBankIndex !== null) {
                // Update existing bank info
                setFormData((prev: any) => {
                    const newBankInfo = prev.bankInfo?.map((bank: any, index: number) =>
                        index === editingBankIndex ? bankData : bank
                    );
                    return {
                        ...prev,
                        bankInfo: newBankInfo,
                    };
                });
                cancelEditBank();
            } else {
                // Add new bank info
                setFormData((prev: any) => {
                    const newBankInfo = [...(prev.bankInfo || []), bankData];
                    return {
                        ...prev,
                        bankInfo: newBankInfo,
                    };
                });
                setBankAccount({ bank: "", code: "", accountNo: "", name: "" });
            }
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.issues.forEach((err: any) => {
                    if (err.path && err.path.length > 0) {
                        fieldErrors[err.path[0]] = err.message;
                    }
                });
                setBankErrors(fieldErrors);
            }
        }
    };

    return [
        {
            bankAccount,
            deposits: [], // Not used in this hook but kept for consistency
            bankErrors,
            isEditingBank,
            editingBankIndex,
            editBankInfoData,
        },
        {
            handleBankChange,
            addBankInfo,
            removeBankInfo,
            editBankInfo,
            cancelEditBank,
            saveBankInfo,
            setBankAccount,
            setBankErrors,
            setIsEditingBank,
            setEditingBankIndex,
            setEditBankInfoData,
        },
    ];
}
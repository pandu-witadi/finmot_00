import { useState } from "react";
import { z } from "zod";
import { depositEntrySchema, type DepositEntry } from "./schemas";

export interface DepositInfoState {
    deposits: DepositEntry[];
    newDeposit: DepositEntry;
    depositErrors: Partial<DepositEntry>;
    isEditing: boolean;
    editingIndex: number | null;
    editDepositData: DepositEntry;
}

export interface DepositInfoActions {
    getDepositDateValue: () => string;
    handleDepositChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    addDeposit: () => void;
    removeDeposit: (index: number) => void;
    editDeposit: (index: number) => void;
    cancelEdit: () => void;
    saveDeposit: () => void;
    calculateTotalDeposit: () => number;
    setDeposits: React.Dispatch<React.SetStateAction<DepositEntry[]>>;
    setNewDeposit: React.Dispatch<React.SetStateAction<DepositEntry>>;
    setDepositErrors: React.Dispatch<React.SetStateAction<Partial<DepositEntry>>>;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
    setEditDepositData: React.Dispatch<React.SetStateAction<DepositEntry>>;
}

export function useDepositInfo(): [DepositInfoState, DepositInfoActions] {
    const [deposits, setDeposits] = useState<DepositEntry[]>([]);
    const [newDeposit, setNewDeposit] = useState<DepositEntry>({
        sign: "+",
        amount: 0,
        note: "",
        date: new Date(),
    });
    const [depositErrors, setDepositErrors] = useState<Partial<DepositEntry>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editDepositData, setEditDepositData] = useState<DepositEntry>({
        sign: "+",
        amount: 0,
        note: "",
        date: new Date(),
    });

    const getDepositDateValue = () => {
        const depositData = isEditing ? editDepositData : newDeposit;
        return depositData.date ? new Date(depositData.date).toISOString().split("T")[0] : "";
    };

    const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (isEditing) {
            setEditDepositData((prev: DepositEntry) => ({
                ...prev,
                [name]: name === "amount" ? (value ? parseFloat(value) : 0) : name === "date" && value ? new Date(value) : (name === "date" ? undefined : value),
            }));
        } else {
            setNewDeposit((prev: DepositEntry) => ({
                ...prev,
                [name]: name === "amount" ? (value ? parseFloat(value) : 0) : name === "date" && value ? new Date(value) : (name === "date" ? undefined : value),
            }));
        }
        
        if (depositErrors[name as keyof DepositEntry]) {
            setDepositErrors((prev: Partial<DepositEntry>) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof DepositEntry];
                return newErrors;
            });
        }
    };

    const addDeposit = () => {
        try {
            depositEntrySchema.parse(newDeposit);
            setDepositErrors({});
            setDeposits((prev: DepositEntry[]) => [...prev, newDeposit]);
            setNewDeposit({ sign: "+", amount: 0, note: "", date: new Date() });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Partial<DepositEntry> = {};
                error.issues.forEach((err: any) => {
                    if (err.path && err.path.length > 0) {
                        fieldErrors[err.path[0] as keyof DepositEntry] = err.message;
                    }
                });
                setDepositErrors(fieldErrors);
            }
        }
    };

    const removeDeposit = (index: number) => {
        setDeposits((prev: DepositEntry[]) => prev.filter((_: DepositEntry, i: number) => i !== index));
    };

    const editDeposit = (index: number) => {
        const depositToEdit = deposits[index];
        setEditDepositData({
            sign: depositToEdit.sign || "+",
            amount: depositToEdit.amount || 0,
            note: depositToEdit.note || "",
            date: depositToEdit.date || new Date(),
        });
        setEditingIndex(index);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditDepositData({ sign: "+", amount: 0, note: "", date: new Date() });
        setEditingIndex(null);
        setIsEditing(false);
        setDepositErrors({});
    };

    const calculateTotalDeposit = () => {
        return deposits.reduce((total: number, deposit: DepositEntry) => {
            const amount = deposit.amount || 0;
            return deposit.sign === "+" ? total + amount : total - amount;
        }, 0);
    };

    const saveDeposit = () => {
        try {
            const depositData = isEditing ? editDepositData : newDeposit;
            depositEntrySchema.parse(depositData);
            setDepositErrors({});
            
            if (isEditing && editingIndex !== null) {
                // Update existing deposit
                setDeposits((prev: DepositEntry[]) => prev.map((deposit: DepositEntry, index: number) => 
                    index === editingIndex ? depositData : deposit
                ));
                cancelEdit();
            } else {
                // Add new deposit
                setDeposits((prev: DepositEntry[]) => [...prev, depositData]);
                setNewDeposit({ sign: "+", amount: 0, note: "", date: new Date() });
            }
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Partial<DepositEntry> = {};
                error.issues.forEach((err: any) => {
                    if (err.path && err.path.length > 0) {
                        fieldErrors[err.path[0] as keyof DepositEntry] = err.message;
                    }
                });
                setDepositErrors(fieldErrors);
            }
        }
    };

    return [
        {
            deposits,
            newDeposit,
            depositErrors,
            isEditing,
            editingIndex,
            editDepositData,
        },
        {
            getDepositDateValue,
            handleDepositChange,
            addDeposit,
            removeDeposit,
            editDeposit,
            cancelEdit,
            saveDeposit,
            calculateTotalDeposit,
            setDeposits,
            setNewDeposit,
            setDepositErrors,
            setIsEditing,
            setEditingIndex,
            setEditDepositData,
        },
    ];
}
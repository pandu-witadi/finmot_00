import { useState, useEffect } from "react";
import { transactionApi } from "@/services/api";
import { toast } from "react-hot-toast";

export interface Transaction {
    id: string;
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: string;
    arrActual: string[];
    updatedBy: string;
    createdAt: Date;
}

export interface TransactionFilter {
    project?: string;
    active?: boolean;
    type?: 'income' | 'expense';
    tags?: string[];
    search?: string;
}

export interface TransactionSort {
    field?: 'name' | 'amount' | 'createdAt';
    order?: 'asc' | 'desc';
}

export interface GetTransactionsQuery {
    filter?: TransactionFilter;
    sort?: TransactionSort;
    limit?: number;
    offset?: number;
}

export function useTransactions(projectId: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<TransactionFilter>({ project: projectId });
    const [sort, setSort] = useState<TransactionSort>({ field: 'createdAt', order: 'desc' });

    const loadData = async () => {
        try {
            setIsLoading(true);
            const query: GetTransactionsQuery = {
                filter: { project: projectId, ...filter },
                sort,
            };
            
            const res = await transactionApi.getAll(query.filter, query.sort);
            const data = Array.isArray(res.data) ? res.data : [];
            setTransactions(data);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to load transactions";
            toast.error(errorMessage);
            console.error("Error loading transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId, filter, sort]);

    const createTransaction = async (data: any) => {
        try {
            const res = await transactionApi.create(data);
            toast.success("Transaction created successfully");
            await loadData();
            return res.data;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to create transaction";
            toast.error(errorMessage);
            throw error;
        }
    };

    const updateTransaction = async (id: string, data: any) => {
        try {
            const res = await transactionApi.update(id, data);
            toast.success("Transaction updated successfully");
            await loadData();
            return res.data;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to update transaction";
            toast.error(errorMessage);
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!window.confirm("Delete this transaction?")) {
            return false;
        }
        try {
            await transactionApi.delete(id);
            toast.success("Transaction deleted successfully");
            await loadData();
            return true;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || "Failed to delete transaction";
            toast.error(errorMessage);
            throw error;
        }
    };

    return {
        transactions,
        isLoading,
        filter,
        setFilter,
        sort,
        setSort,
        loadData,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    };
}
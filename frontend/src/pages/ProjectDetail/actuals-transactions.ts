import { toast } from "react-hot-toast";
import { transactionApi } from "@/services/api";

export async function loadTransactionsForProject(
    projectId: string,
    setIsLoadingTransactions: (value: boolean) => void,
    setTransactionsForSelectedProject: (transactions: { id: string; name: string }[]) => void
): Promise<void> {
    setIsLoadingTransactions(true);
    try {
        const transactionsRes = await transactionApi.getAll({ project: projectId });
        const allTransactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
        const transactionsList = allTransactions.map((t: any) => ({ id: t._id || t.id, name: t.name }));
        setTransactionsForSelectedProject(transactionsList);
    } catch (error: any) {
        toast.error("Failed to load transactions");
    } finally {
        setIsLoadingTransactions(false);
    }
}

export function resetRegisterToTransactionState(
    setIsRegisterToTransactionModalOpen: (open: boolean) => void,
    setSelectedProjectId: (id: string | null) => void,
    setTransactionsForSelectedProject: (transactions: { id: string; name: string }[]) => void,
    setSelectedTransactionId: (id: string | null) => void
): void {
    setIsRegisterToTransactionModalOpen(false);
    setSelectedProjectId(null);
    setTransactionsForSelectedProject([]);
    setSelectedTransactionId(null);
}
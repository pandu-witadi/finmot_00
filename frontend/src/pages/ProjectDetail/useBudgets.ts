import { useState, useEffect, useCallback } from "react"
import { toast } from "react-hot-toast"
import { budgetApi } from "@/services/api"

export interface Budget {
    id: string
    name: string
    tags: string[]
    active: boolean
    type: "income" | "expense"
    done: boolean
    amount: number
    project: string
    header: string
    updatedBy: string
    createdAt: string
}

export interface UseBudgetsReturn {
    budgets: Budget[]
    isLoading: boolean
    fetchBudgets: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
}

export function useBudgets(projectId: string): UseBudgetsReturn {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchBudgets = useCallback(async () => {
        try {
            const response = await budgetApi.getAllByProject(projectId)
            setBudgets(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load budgets"
            toast.error(errorMessage)

            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "/login"
            }
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchBudgets()
    }, [fetchBudgets])

    const handleDelete = useCallback(() => {
        toast.error("Delete not implemented yet")
    }, [])

    const executeDelete = useCallback(async (ids: string[]) => {
        try {
            const deletePromises = ids.map((id) => budgetApi.delete(id))
            await Promise.all(deletePromises)

            const count = ids.length
            toast.success(`Successfully deleted ${count} budget${count !== 1 ? "s" : ""}`)

            await fetchBudgets()
        } catch (error: any) {
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "/login"
                return
            }

            if (error?.response?.status === 404) {
                toast.error("Budget not found")
                return
            }

            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete budgets"
            toast.error(errorMessage)
        }
    }, [fetchBudgets])

    return {
        budgets,
        isLoading,
        fetchBudgets,
        handleDelete,
        executeDelete,
    }
}
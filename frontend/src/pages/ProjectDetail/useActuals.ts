import { useState, useEffect, useCallback } from "react"
import { toast } from "react-hot-toast"
import { actualApi } from "@/services/api"

export interface Actual {
    id: string
    name: string
    amount: number
    active: boolean
    budget: string
    project: string
    updatedBy: string
    createdAt: string
}

export interface UseActualsReturn {
    actuals: Actual[]
    isLoading: boolean
    fetchActuals: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
}

export function useActuals(projectId: string): UseActualsReturn {
    const [actuals, setActuals] = useState<Actual[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchActuals = useCallback(async () => {
        try {
            const response = await actualApi.getAllByProject(projectId)
            setActuals(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load actuals"
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
        fetchActuals()
    }, [fetchActuals])

    const handleDelete = useCallback(() => {
        toast.error("Delete not implemented yet")
    }, [])

    const executeDelete = useCallback(async (ids: string[]) => {
        try {
            const deletePromises = ids.map((id) => actualApi.delete(id))
            await Promise.all(deletePromises)

            const count = ids.length
            toast.success(`Successfully deleted ${count} actual${count !== 1 ? "s" : ""}`)

            await fetchActuals()
        } catch (error: any) {
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "/login"
                return
            }

            if (error?.response?.status === 404) {
                toast.error("Actual not found")
                return
            }

            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete actuals"
            toast.error(errorMessage)
        }
    }, [fetchActuals])

    return {
        actuals,
        isLoading,
        fetchActuals,
        handleDelete,
        executeDelete,
    }
}
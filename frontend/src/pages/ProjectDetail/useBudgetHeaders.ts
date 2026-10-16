import { useState, useEffect, useCallback } from "react"
import { toast } from "react-hot-toast"
import { headerApi } from "@/services/api"

export interface Header {
    id: string
    name: string
    tags: string[]
    active: boolean
    type: "income" | "expense"
    project: string
    arrBudget: string[]
    order: number
    updatedBy: string
    createdAt: string
}

export interface UseHeadersReturn {
    headers: Header[]
    isLoading: boolean
    fetchHeaders: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
}

export function useHeaders(projectId: string): UseHeadersReturn {
    const [headers, setHeaders] = useState<Header[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchHeaders = useCallback(async () => {
        try {
            const response = await headerApi.getAllByProject(projectId)
            setHeaders(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load headers"
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
        fetchHeaders()
    }, [fetchHeaders])

    const handleDelete = useCallback(() => {
        toast.error("Delete not implemented yet")
    }, [])

    const executeDelete = useCallback(async (ids: string[]) => {
        try {
            const deletePromises = ids.map((id) => headerApi.delete(id))
            await Promise.all(deletePromises)

            const count = ids.length
            toast.success(`Successfully deleted ${count} header${count !== 1 ? "s" : ""}`)

            await fetchHeaders()
        } catch (error: any) {
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                window.location.href = "/login"
                return
            }

            if (error?.response?.status === 404) {
                toast.error("Header not found")
                return
            }

            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete headers"
            toast.error(errorMessage)
        }
    }, [fetchHeaders])

    return {
        headers,
        isLoading,
        fetchHeaders,
        handleDelete,
        executeDelete,
    }
}
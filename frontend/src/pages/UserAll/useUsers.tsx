import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { userApi } from "@/services/api"

interface User {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
}

interface UseUsersReturn {
    users: User[]
    selectedUsers: Set<string>
    isLoading: boolean
    setSelectedUsers: React.Dispatch<React.SetStateAction<Set<string>>>
    setConfirmDeleteIds: React.Dispatch<React.SetStateAction<string[] | null>>
    fetchUsers: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
    toggleSelectAll: (checked: boolean) => void
    toggleSelectUser: (id: string, checked: boolean) => void
    isAllSelected: boolean
    isSomeSelected: boolean
    confirmDeleteIds: string[] | null
    showConfirmDialog: boolean
}

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)
    const navigate = useNavigate()

    const fetchUsers = useCallback(async () => {
        try {
            const response = await userApi.getAll()
            setUsers(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load users"
            toast.error(errorMessage)
            
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
            }
        } finally {
            setIsLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleDelete = useCallback((ids: string | string[]) => {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        setConfirmDeleteIds(idsArray)
    }, [])

    const executeDelete = useCallback(async (ids: string[]) => {
        try {
            // Delete users in parallel using Promise.all
            const deletePromises = ids.map((id) => userApi.delete(id))
            await Promise.all(deletePromises)

            // Show success toast
            const count = ids.length
            toast.success(`Successfully deleted ${count} user${count !== 1 ? "s" : ""}`)

            // Refresh the user list
            await fetchUsers()

            // Clear selections and close dialog
            setSelectedUsers(new Set())
            setConfirmDeleteIds(null)
        } catch (error: any) {
            // Handle 401 Unauthorized
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
                return
            }

            // Handle 404 User not found
            if (error?.response?.status === 404) {
                toast.error("User not found")
                return
            }

            // Handle 500 and other errors
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete users"
            toast.error(errorMessage)
        }
    }, [fetchUsers, navigate, setSelectedUsers, setConfirmDeleteIds])

    const toggleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(users.map((u) => u.id)))
        } else {
            setSelectedUsers(new Set())
        }
    }, [users])

    const toggleSelectUser = useCallback((id: string, checked: boolean) => {
        setSelectedUsers((prev) => {
            const next = new Set(prev)
            if (checked) {
                next.add(id)
            } else {
                next.delete(id)
            }
            return next
        })
    }, [])

    const isAllSelected = users.length > 0 && selectedUsers.size === users.length
    const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < users.length

    const showConfirmDialog = confirmDeleteIds !== null

    return {
        users,
        selectedUsers,
        isLoading,
        setSelectedUsers,
        setConfirmDeleteIds,
        fetchUsers,
        handleDelete,
        executeDelete,
        toggleSelectAll,
        toggleSelectUser,
        isAllSelected,
        isSomeSelected,
        confirmDeleteIds,
        showConfirmDialog,
    }
}
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { projectApi } from "@/services/api"

export interface ProjectTableHeaderProps {
    isAllSelected: boolean
    onToggleSelectAll: (checked: boolean) => void
}

export interface Project {
    id: string
    code: string
    name: string
    note: string
    active: boolean
    done: boolean
    typ: 'project' | 'routine' | 'other'
    tags: string[]
    stDate: string
    endDate: string | null
    updatedBy: string
    createdAt: string
}

export interface UseProjectsReturn {
    projects: Project[]
    selectedProjects: Set<string>
    isLoading: boolean
    setSelectedProjects: React.Dispatch<React.SetStateAction<Set<string>>>
    setConfirmDeleteIds: React.Dispatch<React.SetStateAction<string[] | null>>
    fetchProjects: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
    toggleSelectAll: (checked: boolean) => void
    toggleSelectProject: (id: string, checked: boolean) => void
    isAllSelected: boolean
    confirmDeleteIds: string[] | null
    showConfirmDialog: boolean
}

export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)
    const navigate = useNavigate()

    const fetchProjects = useCallback(async () => {
        try {
            const response = await projectApi.getAll()
            setProjects(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load projects"
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
        fetchProjects()
    }, [fetchProjects])

    const handleDelete = useCallback((ids: string | string[]) => {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        setConfirmDeleteIds(idsArray)
    }, [])

    const executeDelete = useCallback(async (ids: string[]) => {
        try {
            const deletePromises = ids.map((id) => projectApi.delete(id))
            await Promise.all(deletePromises)

            const count = ids.length
            toast.success(`Successfully deleted ${count} project${count !== 1 ? "s" : ""}`)

            await fetchProjects()
            setSelectedProjects(new Set())
            setConfirmDeleteIds(null)
        } catch (error: any) {
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
                return
            }

            if (error?.response?.status === 404) {
                toast.error("Project not found")
                return
            }

            const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete projects"
            toast.error(errorMessage)
        }
    }, [fetchProjects, navigate, setSelectedProjects, setConfirmDeleteIds])

    const toggleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedProjects(new Set(projects.map((p) => p.id)))
        } else {
            setSelectedProjects(new Set())
        }
    }, [projects])

    const toggleSelectProject = useCallback((id: string, checked: boolean) => {
        setSelectedProjects((prev) => {
            const next = new Set(prev)
            if (checked) {
                next.add(id)
            } else {
                next.delete(id)
            }
            return next
        })
    }, [])

    const isAllSelected = projects.length > 0 && selectedProjects.size === projects.length

    const showConfirmDialog = confirmDeleteIds !== null

    return {
        projects,
        selectedProjects,
        isLoading,
        setSelectedProjects,
        setConfirmDeleteIds,
        fetchProjects,
        handleDelete,
        executeDelete,
        toggleSelectAll,
        toggleSelectProject,
        isAllSelected,
        confirmDeleteIds,
        showConfirmDialog,
    }
}
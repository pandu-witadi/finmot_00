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

export function getProjectYearMonth(project: Project): string {
    const date = new Date(project.stDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

export interface UseProjectsReturn {
    projects: Project[]
    filteredProjects: Project[]
    selectedProjects: Set<string>
    isLoading: boolean
    setSelectedProjects: React.Dispatch<React.SetStateAction<Set<string>>>
    setConfirmDeleteIds: React.Dispatch<React.SetStateAction<string[] | null>>
    fetchProjects: () => Promise<void>
    handleDelete: (id: string | string[]) => void
    executeDelete: (ids: string[]) => Promise<void>
    toggleSelectAll: (checked: boolean) => void
    toggleSelectProject: (id: string, checked: boolean) => void
    navigateToProject: (id: string) => void
    isAllSelected: boolean
    confirmDeleteIds: string[] | null
    showConfirmDialog: boolean
    filters: {
        search: string
        year: number | null
        type: string | null
        tags: string[]
    }
    setFilter: (key: keyof UseProjectsReturn['filters'], value: any) => void
    clearFilters: () => void
}

export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>([])
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)
    const [filters, setFilters] = useState({
        search: '',
        year: null as number | null,
        type: null as string | null,
        tags: [] as string[]
    })
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

    const navigateToProject = useCallback((id: string) => {
        navigate(`/projects/${id}`)
    }, [navigate])

    const isAllSelected = filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length

    const showConfirmDialog = confirmDeleteIds !== null

    const setFilter = useCallback((key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }, [])

    const clearFilters = useCallback(() => {
        setFilters({
            search: '',
            year: null,
            type: null,
            tags: []
        })
    }, [])

    // Filter projects based on search criteria
    useEffect(() => {
        let result = projects

        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            result = result.filter(p =>
                p.code.toLowerCase().includes(searchLower) ||
                p.name.toLowerCase().includes(searchLower) ||
                p.note.toLowerCase().includes(searchLower)
            )
        }

        if (filters.year) {
            result = result.filter(p => {
                const projectYear = new Date(p.stDate).getFullYear()
                return projectYear === filters.year
            })
        }

        if (filters.type) {
            result = result.filter(p => p.typ === filters.type)
        }

        if (filters.tags.length > 0) {
            result = result.filter(p =>
                filters.tags.some(tag => p.tags.includes(tag))
            )
        }

        setFilteredProjects(result)
    }, [projects, filters])

    return {
        projects,
        filteredProjects,
        selectedProjects,
        isLoading,
        setSelectedProjects,
        setConfirmDeleteIds,
        fetchProjects,
        handleDelete,
        executeDelete,
        toggleSelectAll,
        toggleSelectProject,
        navigateToProject,
        isAllSelected,
        confirmDeleteIds,
        showConfirmDialog,
        filters,
        setFilter,
        clearFilters,
    }
}
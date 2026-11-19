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
    arrHeader: string[]
    arrBudget: string[]
    arrActual: string[]
    arrTransaction: string[]
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
    deletionStatus: Record<string, { canDelete: boolean; blockedBy: string[] }>
    fetchDeletionStatus: (id: string) => Promise<void>
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
    const [deletionStatus, setDeletionStatus] = useState<Record<string, { canDelete: boolean; blockedBy: string[] }>>({})
    const [searchNameTerm, setSearchNameTerm] = useState("")
    const [searchTagTerm, setSearchTagTerm] = useState("")
    const [filterType, setFilterType] = useState<'all' | 'project' | 'routine' | 'other'>('all')
    const [filters, setFilters] = useState({
        search: '',
        year: null as number | null,
        type: null as string | null,
        tags: [] as string[]
    })
    const navigate = useNavigate()

    const fetchDeletionStatus = useCallback(async (id: string) => {
        try {
            const response = await projectApi.getDeletionStatus(id)
            setDeletionStatus(prev => ({
                ...prev,
                [id]: response.data
            }))
        } catch (error: any) {
            // If project not found or other error, treat as can delete
            setDeletionStatus(prev => ({
                ...prev,
                [id]: { canDelete: true, blockedBy: [] }
            }))
        }
    }, [])

    const fetchProjects = useCallback(async () => {
        try {
            const response = await projectApi.getAll()
            const projects = response.data
            setProjects(projects)

            // Fetch deletion status for all projects
            const statusPromises = projects.map((p: Project) => fetchDeletionStatus(p.id))
            await Promise.all(statusPromises)
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
    }, [navigate, fetchDeletionStatus])

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const handleDelete = useCallback(async (ids: string | string[]) => {
        const idsArray = Array.isArray(ids) ? ids : [ids]
        
        // Check deletion status for each project
        const toDelete: string[] = []
        const blocked: Record<string, string[]> = {}
        
        for (const id of idsArray) {
            const status = deletionStatus[id]
            if (status && !status.canDelete) {
                blocked[id] = status.blockedBy
            } else {
                toDelete.push(id)
            }
        }
        
        // If any projects are blocked, show error for those
        if (Object.keys(blocked).length > 0) {
            for (const [id, blockedBy] of Object.entries(blocked)) {
                toast.error(`Cannot delete project: ${blockedBy.join(', ')}`)
            }
            // Clear the selection for blocked projects
            setSelectedProjects(prev => {
                const next = new Set(prev)
                for (const id of Object.keys(blocked)) {
                    next.delete(id)
                }
                return next
            })
            setConfirmDeleteIds(null)
            return
        }
        
        setConfirmDeleteIds(idsArray)
    }, [deletionStatus, setSelectedProjects])

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
        setSearchNameTerm("")
        setSearchTagTerm("")
    }, [])

    // Filter projects based on search criteria
    useEffect(() => {
        let result = projects

        // Search by code, name, note
        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            result = result.filter(p =>
                p.code.toLowerCase().includes(searchLower) ||
                p.name.toLowerCase().includes(searchLower) ||
                p.note.toLowerCase().includes(searchLower)
            )
        }

        // Name search (simplified like actuals)
        if (searchNameTerm) {
            const nameLower = searchNameTerm.toLowerCase()
            result = result.filter(p =>
                p.name.toLowerCase().includes(nameLower)
            )
        }

        // Year filter
        if (filters.year) {
            result = result.filter(p => {
                const projectYear = new Date(p.stDate).getFullYear()
                return projectYear === filters.year
            })
        }

        // Type filter (simplified)
        if (filters.type && filters.type !== 'all') {
            result = result.filter(p => p.typ === filters.type)
        }

        // Tags search
        if (filters.tags.length > 0) {
            result = result.filter(p =>
                filters.tags.some(tag => p.tags.includes(tag))
            )
        }

        // Tags filter (simplified like actuals)
        if (searchTagTerm) {
            const tagLower = searchTagTerm.toLowerCase()
            result = result.filter(p =>
                p.tags.some(tag => tag.toLowerCase().includes(tagLower))
            )
        }

        setFilteredProjects(result)
    }, [projects, filters, searchNameTerm, filterType, searchTagTerm])

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
        deletionStatus,
        fetchDeletionStatus,
        searchNameTerm,
        setSearchNameTerm,
        searchTagTerm,
        setSearchTagTerm,
        filters,
        setFilter,
        clearFilters,
    }
}
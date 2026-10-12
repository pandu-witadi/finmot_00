import { ProjectTableHeader } from "./ProjectTableHeader"
import { ProjectTableRow } from "./ProjectTableRow"
import { useProjects } from "./useProjects"
import {
    Table,
    TableBody,
} from "@/components/ui/table"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export function ProjectAll() {
    const {
        projects,
        selectedProjects,
        isLoading,
        setSelectedProjects,
        setConfirmDeleteIds,
        executeDelete,
        toggleSelectAll,
        toggleSelectProject,
        handleDelete,
        isAllSelected,
        confirmDeleteIds,
        showConfirmDialog,
    } = useProjects()

    const handleBulkDelete = () => {
        handleDelete(Array.from(selectedProjects))
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    {selectedProjects.size > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {selectedProjects.size} project{selectedProjects.size !== 1 ? "s" : ""} selected
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedProjects.size > 0 && (
                        <Button variant="outline" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                    )}
                    <Button asChild>
                        <Link to="/projects/new">
                            <Plus className="h-4 w-4" />
                            Add Project
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table className=" [&_tr[data-state=selected]_td]:bg-muted/30">
                    <ProjectTableHeader 
                        isAllSelected={isAllSelected} 
                        onToggleSelectAll={toggleSelectAll}
                    />
                    <TableBody>
                        {projects.length === 0 ? (
                            <tr className="border-b">
                                <td colSpan={6} className="h-12 px-4 align-middle text-center text-muted-foreground">
                                    No projects yet. Create your first project to start tracking.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project, index) => (
                                <ProjectTableRow
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    isSelected={selectedProjects.has(project.id)}
                                    onSelect={toggleSelectProject}
                                    onRowClick={(id) => console.log('Navigate to project:', id)}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedProjects(new Set())
                        setConfirmDeleteIds(null)
                    }
                }}
                onConfirm={() => {
                    if (confirmDeleteIds) {
                        executeDelete(confirmDeleteIds)
                    }
                }}
                title={confirmDeleteIds && confirmDeleteIds.length === 1 
                    ? `Are you sure you want to delete this project?`
                    : `Are you sure you want to delete ${confirmDeleteIds?.length || 0} projects?`}
                description={confirmDeleteIds && confirmDeleteIds.length === 1
                    ? "This action cannot be undone. The project will be permanently removed from the system."
                    : "This action cannot be undone. The selected projects will be permanently removed from the system."}
                confirmText="Yes, delete"
                cancelText="Cancel"
            />
        </div>
    )
}
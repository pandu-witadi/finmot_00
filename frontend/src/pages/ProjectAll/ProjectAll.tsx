import { useState, useMemo } from "react";
import { ProjectTableHeader } from "./ProjectTableHeader";
import { ProjectTableRow } from "./ProjectTableRow";
import { useProjects } from "./useProjects";
import { ProjectHeader } from "@/components/ProjectHeader";
import { Table, TableBody } from "@/components/ui/table";
import { RefreshCw, Calendar, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";

export function ProjectAll() {
    const {
        projects,
        filteredProjects,
        selectedProjects,
        isLoading,
        setSelectedProjects,
        setConfirmDeleteIds,
        executeDelete,
        toggleSelectAll,
        toggleSelectProject,
        navigateToProject,
        handleDelete,
        isAllSelected,
        confirmDeleteIds,
        showConfirmDialog,
        deletionStatus,
        filters,
        setFilter,
        clearFilters,
    } = useProjects();

    const navigate = useNavigate();

    const [columnVisibility, setColumnVisibility] = useState({
        code: true,
        name: true,
        date: true,
        tags: true,
        type: true,
        active: true,
        done: true,
    });

    const toggleColumn = (column: keyof typeof columnVisibility) => {
        setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const columns = useMemo(() => [
        { label: 'Code', visible: columnVisibility.code, toggle: () => toggleColumn('code') },
        { label: 'Name', visible: columnVisibility.name, toggle: () => toggleColumn('name') },
        { label: 'Date', visible: columnVisibility.date, toggle: () => toggleColumn('date') },
        { label: 'Tags', visible: columnVisibility.tags, toggle: () => toggleColumn('tags') },
        { label: 'Type', visible: columnVisibility.type, toggle: () => toggleColumn('type') },
        { label: 'Active', visible: columnVisibility.active, toggle: () => toggleColumn('active') },
        { label: 'Done', visible: columnVisibility.done, toggle: () => toggleColumn('done') },
    ], [columnVisibility]);

    const handleAddProject = () => {
        navigate("/projects/new");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ProjectHeader
                onAddProject={handleAddProject}
                onDeleteSelected={handleDelete}
                selectedProjects={selectedProjects}
                columns={columns}
            />

            <div className="rounded-md border border-border bg-card">
                <div className="flex flex-wrap items-center gap-3 p-3">
                    <Input
                        placeholder="Name"
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="h-8 w-24"
                    />
                    <Input
                        placeholder="Tags"
                        value={filters.tags.join(', ')}
                        onChange={(e) => {
                            const tags = e.target.value
                                .split(/\s*,\s*/)
                                .map(t => t.trim())
                                .filter(t => t.length > 0);
                            setFilter('tags', tags);
                        }}
                        className="h-8 w-24"
                    />
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                            className="h-8 pl-9 pr-8 rounded-md border border-input bg-background text-xs outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                            value={filters.year || ''}
                            onChange={(e) => setFilter('year', e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">All years</option>
                            {projects.map(p => new Date(p.stDate).getFullYear())
                                .filter((value, index, self) => self.indexOf(value) === index)
                                .sort((a, b) => b - a)
                                .map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                        </select>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild={true}>
                            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background px-3 py-1.5 hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
                                Type: {filters.type === null || filters.type === '' ? 'All' : filters.type === 'project' ? 'Project' : filters.type === 'routine' ? 'Routine' : 'Other'}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilter('type', null)}>
                                All
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('type', 'project')}>
                                Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('type', 'routine')}>
                                Routine
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('type', 'other')}>
                                Other
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {(filters.search || filters.year || filters.type || filters.tags.length > 0) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="rounded-md border">
                <Table className=" [&_tr[data-state=selected]_td]:bg-muted/30">
                    <ProjectTableHeader 
                        isAllSelected={isAllSelected} 
                        onToggleSelectAll={toggleSelectAll}
                    />
                    <TableBody>
                        <ProjectTableContent 
                            projects={projects} 
                            filteredProjects={filteredProjects} 
                            selectedProjects={selectedProjects}
                            toggleSelectProject={toggleSelectProject}
                            navigateToProject={navigateToProject}
                        />
                    </TableBody>
                </Table>
            </div>
            
            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedProjects(new Set());
                        setConfirmDeleteIds(null);
                    }
                }}
                onConfirm={() => {
                    if (confirmDeleteIds) {
                        executeDelete(confirmDeleteIds);
                    }
                }}
                title={confirmDeleteIds && confirmDeleteIds.length === 1 
                    ? `Are you sure you want to delete this project?`
                    : `Are you sure you want to delete ${confirmDeleteIds?.length || 0} projects?`}
                description={(() => {
                    if (!confirmDeleteIds) return "";
                    
                    // Check if any project cannot be deleted
                    const cannotDelete: string[] = [];
                    const canDeleteCount = confirmDeleteIds.length;
                    
                    for (const id of confirmDeleteIds) {
                        const status = deletionStatus[id];
                        if (status && !status.canDelete) {
                            cannotDelete.push(id);
                        }
                    }
                    
                    if (cannotDelete.length > 0) {
                        return `Cannot delete ${cannotDelete.length} project(s) due to existing data. ${canDeleteCount - cannotDelete.length} project(s) can be deleted.`;
                    }
                    
                    return confirmDeleteIds.length === 1
                        ? "This action cannot be undone. The project will be permanently removed from the system."
                        : "This action cannot be undone. The selected projects will be permanently removed from the system.";
                })()}
                confirmText="Yes, delete"
                cancelText="Cancel"
            />
        </div>
    );
}

function ProjectTableContent({ projects, filteredProjects, selectedProjects, toggleSelectProject, navigateToProject }: { 
    projects: any[]; 
    filteredProjects: any[]; 
    selectedProjects: Set<string>;
    toggleSelectProject: (id: string) => void;
    navigateToProject: (id: string) => void;
}) {
    if (filteredProjects.length === 0) {
        return (
            <tr className="border-b">
                <td colSpan={8} className="h-12 px-4 align-middle text-center text-muted-foreground">
                    {projects.length === 0 ? 'No projects yet. Create your first project to start tracking.' : 'No projects match your filters.'}
                </td>
            </tr>
        );
    }

    return (
        <>
            {filteredProjects.map((project, index) => (
                <ProjectTableRow
                    key={project.id}
                    project={project}
                    index={index}
                    isSelected={selectedProjects.has(project.id)}
                    onSelect={toggleSelectProject}
                    onRowClick={navigateToProject}
                />
            ))}
        </>
    );
}

export default ProjectAll;
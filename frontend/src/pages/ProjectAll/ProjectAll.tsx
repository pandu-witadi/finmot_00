import { useState, useMemo } from "react";
import { ProjectTableHeader } from "./ProjectTableHeader";
import { ProjectTableRow } from "./ProjectTableRow";
import { useProjects } from "./useProjects";
import { ProjectHeader } from "@/components/ProjectHeader";
import { Table, TableBody } from "@/components/ui/table";
import { RefreshCw, Search, Calendar, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";

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

            <FiltersSection
                filters={filters}
                projects={projects}
                clearFilters={clearFilters}
                setFilter={setFilter}
            />

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
                description={confirmDeleteIds && confirmDeleteIds.length === 1
                    ? "This action cannot be undone. The project will be permanently removed from the system."
                    : "This action cannot be undone. The selected projects will be permanently removed from the system."}
                confirmText="Yes, delete"
                cancelText="Cancel"
            />
        </div>
    );
}

function FiltersSection({ filters, projects, clearFilters, setFilter }: { filters: any; projects: any[]; clearFilters: () => void; setFilter: (key: string, value: any) => void }) {
    return (
        <div className="rounded-md border p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
                {(filters.search || filters.year || filters.type || filters.tags.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SearchFilter filters={filters} setFilter={setFilter} />
                <YearFilter filters={filters} projects={projects} setFilter={setFilter} />
                <TypeFilter filters={filters} setFilter={setFilter} />
                <TagsFilter filters={filters} setFilter={setFilter} />
            </div>
        </div>
    );
}

function SearchFilter({ filters, setFilter }: { filters: any; setFilter: (key: string, value: any) => void }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="search" className="text-xs font-medium">Search</Label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search"
                    placeholder="Code, name, note..."
                    className="pl-9 h-9 text-sm"
                    value={filters.search}
                    onChange={(e) => setFilter('search', e.target.value)}
                />
            </div>
        </div>
    );
}

function YearFilter({ filters, projects, setFilter }: { filters: any; projects: any[]; setFilter: (key: string, value: any) => void }) {
    const uniqueYears = useMemo(() => {
        return projects.map(p => new Date(p.stDate).getFullYear())
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => b - a);
    }, [projects]);

    return (
        <div className="space-y-2">
            <Label htmlFor="year" className="text-xs font-medium">Year</Label>
            <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                    id="year"
                    className="h-9 px-3 pl-9 pr-8 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    value={filters.year || ''}
                    onChange={(e) => setFilter('year', e.target.value ? parseInt(e.target.value) : null)}
                >
                    <option value="">All years</option>
                    {uniqueYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function TypeFilter({ filters, setFilter }: { filters: any; setFilter: (key: string, value: any) => void }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="type" className="text-xs font-medium">Type</Label>
            <select
                id="type"
                className="h-9 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                value={filters.type || ''}
                onChange={(e) => setFilter('type', e.target.value === '' ? null : e.target.value)}
            >
                <option value="">All types</option>
                <option value="project">Project</option>
                <option value="routine">Routine</option>
                <option value="other">Other</option>
            </select>
        </div>
    );
}

function TagsFilter({ filters, setFilter }: { filters: any; setFilter: (key: string, value: any) => void }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="tags" className="text-xs font-medium">Tags</Label>
            <Input
                id="tags"
                placeholder="Comma-separated tags..."
                className="h-9 text-sm"
                value={filters.tags.join(', ')}
                onChange={(e) => {
                    const tags = e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                    setFilter('tags', tags);
                }}
            />
            {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {filters.tags.map((tag: string, i: number) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {tag}
                            <button
                                onClick={() => {
                                    const newTags = filters.tags.filter((_, idx) => idx !== i);
                                    setFilter('tags', newTags);
                                }}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
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
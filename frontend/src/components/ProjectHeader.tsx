import { Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon } from "lucide-react";

interface ProjectHeaderProps {
    onAddProject: () => void;
    onDeleteSelected?: (ids: string[]) => void;
    selectedProjects?: Set<string>;
    columns?: { label: string; visible: boolean; toggle: () => void }[];
}

export function ProjectHeader({ onAddProject, onDeleteSelected, selectedProjects = new Set(), columns = [] }: ProjectHeaderProps) {
    return (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2">
                {/* Projects Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" className="h-8 px-3"><span>Projects</span></Button>}>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => {}}>
                                <Link to="/projects" className="w-full block">
                                    All Projects
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>
                                <span className="text-muted-foreground">Favorites (0)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <span className="text-muted-foreground">Archived (0)</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Add Project Button */}
                <Button onClick={onAddProject} variant="default" className="h-8 px-3">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                </Button>

                {/* Delete Selected Button */}
                {selectedProjects.size > 0 && onDeleteSelected && (
                    <Button variant="destructive" size="sm" onClick={() => onDeleteSelected(Array.from(selectedProjects))}>
                        <X className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedProjects.size})
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {/* Column Visibility Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" className="h-8 px-3"><span>Columns</span></Button>}>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.map((col) => (
                                <DropdownMenuItem
                                    key={col.label}
                                    className="flex items-center justify-between"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        col.toggle();
                                    }}
                                >
                                    <span>{col.label}</span>
                                    <div className="flex items-center">
                                        {col.visible && <CheckIcon className="h-4 w-4" />}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
import { ProjectTableHeaderProps } from './useProjects';

export function ProjectTableHeader({ isAllSelected, onToggleSelectAll }: ProjectTableHeaderProps) {
    return (
        <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={isAllSelected}
                        onChange={(e) => onToggleSelectAll(e.target.checked)}
                    />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Active</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Done</th>
            </tr>
        </thead>
    )
}
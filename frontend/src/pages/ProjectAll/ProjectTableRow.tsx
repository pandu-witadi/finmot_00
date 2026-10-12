import { Project } from './useProjects';

interface ProjectTableRowProps {
    project: Project
    index: number
    isSelected: boolean
    onSelect: (id: string, checked: boolean) => void
    onRowClick: (id: string) => void
}

export function ProjectTableRow({ project, index, isSelected, onSelect, onRowClick }: ProjectTableRowProps) {
    return (
        <tr
            className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${index % 2 === 0 ? 'bg-background' : ''}`}
            onClick={() => onRowClick(project.id)}
        >
            <td className="h-12 px-4 align-middle">
                <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation()
                        onSelect(project.id, e.target.checked)
                    }}
                />
            </td>
            <td className="h-12 px-4 align-middle font-medium">{project.code}</td>
            <td className="h-12 px-4 align-middle">{project.name}</td>
            <td className="h-12 px-4 align-middle capitalize">{project.typ}</td>
            <td className="h-12 px-4 align-middle">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${project.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {project.active ? 'Yes' : 'No'}
                </span>
            </td>
            <td className="h-12 px-4 align-middle">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${project.done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {project.done ? 'Yes' : 'No'}
                </span>
            </td>
        </tr>
    )
}
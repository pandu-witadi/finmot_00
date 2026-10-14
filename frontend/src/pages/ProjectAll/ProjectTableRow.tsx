import { Project, getProjectYearMonth } from './useProjects';

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
            onClick={(e) => {
                if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                    onRowClick(project.id)
                }
            }}
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
            <td className="h-12 px-4 align-middle">
                <button
                    className="font-medium text-primary hover:underline focus:outline-none"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRowClick(project.id)
                    }}
                >
                    {project.code}
                </button>
            </td>
            <td className="h-12 px-4 align-middle">
                <button
                    className="text-primary hover:underline focus:outline-none"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRowClick(project.id)
                    }}
                >
                    {project.name}
                </button>
            </td>
            <td className="h-12 px-4 align-middle">{getProjectYearMonth(project)}</td>
            <td className="h-12 px-4 align-middle">
                <div className="flex flex-col gap-0.5">
                    {project.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-xs">
                            {tag}
                        </span>
                    ))}
                </div>
            </td>
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
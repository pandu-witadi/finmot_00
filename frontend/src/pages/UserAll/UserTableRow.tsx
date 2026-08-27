import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { Edit } from "lucide-react"
import { Link } from "react-router-dom"

interface User {
    id: string
    email: string
    name: string | null
    role: string
    createdAt: string
}

interface UserTableRowProps {
    user: User
    index: number
    isSelected: boolean
    onSelect: (id: string, checked: boolean) => void
    onRowClick: (id: string) => void
}

export function UserTableRow({ user, index, isSelected, onSelect, onRowClick }: UserTableRowProps) {
    return (
        <TableRow 
            key={user.id} 
            data-state={isSelected ? "selected" : undefined}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onRowClick(user.id)}
        >
            <TableCell>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect(user.id, checked as boolean)}
                    aria-label={`Select ${user.email}`}
                    onClick={(e) => e.stopPropagation()}
                />
            </TableCell>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.name || "-"}</TableCell>
            <TableCell>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                    {user.role}
                </span>
            </TableCell>
            <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link to={`/users/${user.id}`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
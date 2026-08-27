import { TableCell, TableRow } from "@/components/ui/table"

interface UserTableEmptyProps {
    colSpan?: number
}

export function UserTableEmpty({ colSpan = 7 }: UserTableEmptyProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                No users found
            </TableCell>
        </TableRow>
    )
}
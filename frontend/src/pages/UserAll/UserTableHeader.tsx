import { Checkbox } from "@/components/ui/checkbox"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UserTableHeaderProps {
    isAllSelected: boolean
    onToggleSelectAll: (checked: boolean) => void
}

export function UserTableHeader({ isAllSelected, onToggleSelectAll }: UserTableHeaderProps) {
    return (
        <TableHeader>
            <TableRow>
                <TableHead className="w-12">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={onToggleSelectAll}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead>#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
    )
}
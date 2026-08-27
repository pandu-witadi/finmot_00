import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useUsers } from "./useUsers"
import { UserTableHeader } from "./UserTableHeader"
import { UserTableRow } from "./UserTableRow"
import { UserTableEmpty } from "./UserTableEmpty"
import {
    Table,
    TableBody,
} from "@/components/ui/table"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export function UserAll() {
    const navigate = useNavigate()
    const {
        users,
        selectedUsers,
        isLoading,
        setSelectedUsers,
        setConfirmDeleteIds,
        executeDelete,
        toggleSelectAll,
        toggleSelectUser,
        handleDelete,
        isAllSelected,
        confirmDeleteIds,
        showConfirmDialog,
    } = useUsers()

    const handleBulkDelete = () => {
        handleDelete(Array.from(selectedUsers))
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
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    {selectedUsers.size > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedUsers.size > 0 && (
                        <Button variant="outline" onClick={handleBulkDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected
                        </Button>
                    )}
                    <Button asChild>
                        <Link to="/users/new">
                            <Plus className="h-4 w-4" />
                            Add User
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table className=" [&_tr[data-state=selected]_td]:bg-muted/30">
                    <UserTableHeader 
                        isAllSelected={isAllSelected} 
                        onToggleSelectAll={toggleSelectAll}
                    />
                    <TableBody>
                        {users.length === 0 ? (
                            <UserTableEmpty />
                        ) : (
                            users.map((user, index) => (
                                <UserTableRow
                                    key={user.id}
                                    user={user}
                                    index={index}
                                    isSelected={selectedUsers.has(user.id)}
                                    onSelect={toggleSelectUser}
                                    onDelete={(id) => {
            handleDelete(id)
        }}
                                    onRowClick={(id) => navigate(`/users/${id}`)}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={(open) => {
                    // Clear selected users when dialog is closed
                    if (!open) {
                        setSelectedUsers(new Set())
                        setConfirmDeleteIds(null)
                    }
                }}
                onConfirm={() => {
                    if (confirmDeleteIds) {
                        executeDelete(confirmDeleteIds)
                    }
                }}
                title={confirmDeleteIds && confirmDeleteIds.length === 1 
                    ? `Are you sure you want to delete this user?`
                    : `Are you sure you want to delete ${confirmDeleteIds?.length || 0} users?`}
                description={confirmDeleteIds && confirmDeleteIds.length === 1
                    ? "This action cannot be undone. The user will be permanently removed from the system."
                    : "This action cannot be undone. The selected users will be permanently removed from the system."}
                confirmText="Yes, delete"
                cancelText="Cancel"
            />
        </div>
    )
}
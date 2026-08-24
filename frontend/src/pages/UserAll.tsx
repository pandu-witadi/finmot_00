import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { userApi } from "@/services/api"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export function UserAll() {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    const fetchUsers = async () => {
        try {
            const response = await userApi.getAll()
            setUsers(response.data)
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to load users"
            toast.error(errorMessage)
            
            if (error?.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [])

    useEffect(() => {
    }, [isLoading, users.length])

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return
        }

        try {
            await userApi.delete(id)
            toast.success("User deleted successfully")
            setUsers(users.filter((user) => user.id !== id))
            setSelectedUsers((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        } catch (error) {
            toast.error("Failed to delete user")
        }
    }

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(new Set(users.map((u) => u.id)))
        } else {
            setSelectedUsers(new Set())
        }
    }

    const toggleSelectUser = (id: string, checked: boolean) => {
        setSelectedUsers((prev) => {
            const next = new Set(prev)
            if (checked) {
                next.add(id)
            } else {
                next.delete(id)
            }
            return next
        })
    }

    const isAllSelected = users.length > 0 && selectedUsers.size === users.length
    const isSomeSelected = selectedUsers.size > 0 && selectedUsers.size < users.length

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
                <Button asChild>
                    <Link to="/users/new">
                        <Plus className="h-4 w-4" />
                        Add User
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table className=" [&_tr[data-state=selected]_td]:bg-muted/30">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={toggleSelectAll}
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
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => (
                                <TableRow 
                                    key={user.id} 
                                    data-state={selectedUsers.has(user.id) ? "selected" : undefined}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/users/${user.id}/edit`)}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedUsers.has(user.id)}
                                            onCheckedChange={(checked) => toggleSelectUser(user.id, checked as boolean)}
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
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}/edit`)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
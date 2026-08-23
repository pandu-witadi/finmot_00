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
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { userApi } from "@/services/api"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export function UserAll() {
    const [users, setUsers] = useState<any[]>([])
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
        } catch (error) {
            toast.error("Failed to delete user")
        }
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
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <Link to="/users/new">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
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
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
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
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/users/${user.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
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
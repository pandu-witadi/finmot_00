import { User } from "./ProjectActuals";

export function filterUsers(
    users: User[],
    searchTerm: string
): User[] {
    if (!users || users.length === 0) return [];
    return users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
}
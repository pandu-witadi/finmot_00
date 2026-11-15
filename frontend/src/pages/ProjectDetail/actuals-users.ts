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

export function toggleUserSelection(
    userId: string,
    selectedUsers: Set<string>,
    setSelectedUsers: (users: Set<string>) => void
): void {
    const newSet = new Set(selectedUsers);
    newSet.has(userId) ? newSet.delete(userId) : newSet.add(userId);
    setSelectedUsers(newSet);
}
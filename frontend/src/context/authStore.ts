import { create } from "zustand";

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
    role: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    setUser: (user: User | null) => void;
    setIsLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => {
        localStorage.setItem("token", user.token);
        set({ user, isAuthenticated: true, isLoading: false });
    },
    logout: () => {
        localStorage.removeItem("token");
        set({ user: null, isAuthenticated: false, isLoading: false });
    },
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    checkAuth: async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length !== 3) {
                    throw new Error('Invalid token format');
                }
                
                const decoded = JSON.parse(atob(tokenParts[1]));
                const user = {
                    id: decoded.id,
                    email: decoded.email,
                    name: decoded.name || '',
                    token: token,
                    role: decoded.role || 'user'
                };
                set({ user, isAuthenticated: true, isLoading: false });
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem("token");
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
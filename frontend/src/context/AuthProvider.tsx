import { createContext, useContext } from "react";
import { useAuthStore } from "./authStore";

const AuthContext = createContext<{
    user: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: any) => void;
    logout: () => void;
    setUser: (user: any) => void;
    setIsLoading: (loading: boolean) => void;
    checkAuth: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const authState = useAuthStore();

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
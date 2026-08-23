import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { useEffect } from "react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectPath?: string;
}

export function ProtectedRoute({
    children,
    redirectPath = "/login",
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, checkAuth } = useAuth();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
}
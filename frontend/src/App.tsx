import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { About } from '@/pages/About';
import { UserAll } from '@/pages/UserAll';
import { UserForm } from '@/pages/UserForm';
import { UserEdit } from '@/pages/UserEdit';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes - standalone (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />

                {/* Protected routes - wrapped in MainLayout -- must use Outlet */}
                <Route path="/" element={<ProtectedRoute><MainLayout><Outlet /></MainLayout></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="users" element={<UserAll />} />
                    <Route path="users/new" element={<UserForm />} />
                    <Route path="users/:id/edit" element={<UserEdit />} />
                    <Route path="about" element={<About />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

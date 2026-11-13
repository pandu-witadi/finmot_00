import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { About } from '@/pages/About';
import { UserAll } from '@/pages/UserAll/index';
import { UserAdd } from '@/pages/UserAll/UserAdd';
import { UserDetail } from '@/pages/UserDetail/index';
import { ActualDetail } from '@/pages/ActualDetail';
import { BudgetDetail } from '@/pages/BudgetDetail';
import { ProjectAll, ProjectAdd } from '@/pages/ProjectAll/index';
import { ProjectDetail } from '@/pages/ProjectDetail/index';
import { TransactionDetail } from '@/pages/TransactionDetail';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

export const App = () => {
    return (
        <BrowserRouter>
            <Toaster position="top-left" />
            <Routes>
                {/* Public routes - standalone (no layout) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />

                {/* Protected routes - wrapped in MainLayout -- must use Outlet */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Outlet />
                        </MainLayout>
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="users" element={<UserAll />} />
                    <Route path="users/new" element={<UserAdd />} />
                    <Route path="users/:id" element={<UserDetail />} />
                    <Route path="projects" element={<ProjectAll />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="actuals/:id" element={<ActualDetail />} />
                    <Route path="budgets/:id" element={<BudgetDetail />} />
                    <Route path="transactions/:id" element={<TransactionDetail />} />
                    <Route path="projects/new" element={<ProjectAdd />} />
                    <Route path="about" element={<About />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card.tsx';
import { Button } from '@components/ui/button.tsx';
import { Plus, TrendingUp, Wallet, PieChart, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        toast.promise(
            new Promise<{ data?: string }>((resolve) => {
                logout();
                resolve({ data: 'Logged out successfully' });
            }),
            {
                loading: 'Logging out...',
                success: (data) => {
                    return data?.data || 'Logged out successfully';
                },
                error: (err) => err.message || 'Failed to logout',
            }
        );
    };
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                    <Button onClick={() => navigate('/projects/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Start by creating your first project</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">Total across all projects</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Insights</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">Available soon</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Get started with your financial tracking</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate('/projects/new')}>
                                Add Project
                            </Button>
                            <Button variant="outline" size="sm">
                                Import Transactions
                            </Button>
                            <Button variant="outline" size="sm">
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Project Overview</CardTitle>
                        <CardDescription>Your projects will appear here</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            No projects yet. Create your first project to start tracking.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
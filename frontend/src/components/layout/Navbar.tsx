import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Info, BarChart3, LogIn, LogOut } from 'lucide-react';
import { Button } from '@components/ui/button.tsx';
import { useAuth } from '@/context/AuthProvider';

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <BarChart3 className="h-6 w-6" />
                        <span>Finmot</span>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {isAuthenticated && (
                            <>
                                <Button
                                    onClick={() => {}}
                                    variant={location.pathname === '/' ? 'default' : 'ghost'}
                                    size="sm"
                                >
                                    <Link to="/" className="flex items-center gap-2">
                                        <Home className="h-4 w-4" />
                                        <span className="hidden md:inline">Dashboard</span>
                                    </Link>
                                </Button>

                                <Button
                                    onClick={() => {}}
                                    variant={location.pathname === '/about' ? 'default' : 'ghost'}
                                    size="sm"
                                >
                                    <Link to="/about" className="flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        <span className="hidden md:inline">About</span>
                                    </Link>
                                </Button>
                            </>
                        )}

                        {isAuthenticated ? (
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">Logout</span>
                            </Button>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    <span className="hidden md:inline">Login</span>
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};
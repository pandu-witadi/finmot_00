import { Link, useLocation } from 'react-router-dom';
import { Home, Info, BarChart3 } from 'lucide-react';
import { Button } from '@components/ui/button';

export const Navbar = () => {
    const location = useLocation();

    return (
        <header className="border-b">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                        <BarChart3 className="h-6 w-6" />
                        <span>Finmot</span>
                    </Link>

                    <nav className="flex items-center gap-2">
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
                    </nav>
                </div>
            </div>
        </header>
    );
};
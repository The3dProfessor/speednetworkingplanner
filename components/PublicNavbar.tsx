import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const PublicNavbar: React.FC = () => {
    const navLinkClasses = "text-slate-300 hover:text-emerald-400 transition-colors duration-200";
    
    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-white">
                    <span className="text-emerald-400">Speed</span>Networking<span className="text-cyan-400">Planner</span>
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                    <NavLink to="/pricing" className={({isActive}) => isActive ? "text-emerald-400 font-semibold" : navLinkClasses}>Pricing</NavLink>
                    <NavLink to="/login" className={({isActive}) => isActive ? "text-emerald-400 font-semibold" : navLinkClasses}>Log In</NavLink>
                    <Link to="/signup" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:opacity-90 transition-opacity">
                        Sign Up Free
                    </Link>
                </div>
                <div className="md:hidden">
                    {/* Mobile menu button can be added here */}
                </div>
            </nav>
        </header>
    );
};

export default PublicNavbar;

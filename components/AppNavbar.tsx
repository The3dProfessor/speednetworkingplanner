import React, { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AppNavbar: React.FC = () => {
    const { user, logout } = useContext(AuthContext);

    const navLinkClasses = "text-sm text-slate-300 hover:text-emerald-400 transition-colors duration-200";

    return (
        <header className="bg-slate-800 shadow-lg">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                   <Link to="/app/dashboard" className="text-xl font-bold text-white">
                        <span className="text-emerald-400">SNP</span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink to="/app/dashboard" className={({isActive}) => isActive ? "text-emerald-400 font-semibold text-sm" : navLinkClasses}>Dashboard</NavLink>
                        {/* Add other app links here e.g. Attendee Management */}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {user && <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>}
                     <button
                        onClick={logout}
                        className="bg-slate-700 text-white font-semibold py-2 px-4 text-xs rounded-md shadow-sm hover:bg-slate-600 transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default AppNavbar;

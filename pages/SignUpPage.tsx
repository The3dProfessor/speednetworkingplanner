import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SignUpPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd create a new user account.
        // For this MVP, we'll just log them in with the default free plan.
        if (email && password) {
            login('Free');
        } else {
            alert("Please enter an email and password.");
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 shadow-xl rounded-lg p-8">
                <div className="text-center mb-8">
                     <Link to="/" className="text-2xl font-bold text-white">
                        <span className="text-emerald-400">Speed</span>Networking<span className="text-cyan-400">Planner</span>
                    </Link>
                    <h2 className="mt-4 text-2xl font-bold text-white">Create your free account</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                         <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 transition-opacity"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;

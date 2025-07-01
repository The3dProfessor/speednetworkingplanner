import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppNavbar from '../components/AppNavbar';
import type { Event } from '../types';

// Mock data for demonstration purposes
const mockEvents: Event[] = [
    { id: 'evt1', name: 'Q4 Tech Mixer', attendees: 45, date: '2024-10-26' },
    { id: 'evt2', name: 'Annual Company Kick-off', attendees: 88, date: '2024-01-15' },
    { id: 'evt3', name: 'Startup Networking Night', attendees: 30, date: '2023-11-05' },
];

const DashboardPage: React.FC = () => {
    const { user } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 font-sans">
            <AppNavbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                        <p className="text-slate-400 mt-1">Welcome back, {user?.email}!</p>
                    </div>
                    <Link
                        to="/app/planner"
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-md shadow-md hover:opacity-90 transition-opacity"
                    >
                        + Create New Event
                    </Link>
                </div>

                {/* Plan Information */}
                <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 mb-8 flex flex-wrap justify-between items-center">
                    <p>You are currently on the <span className="font-bold text-emerald-400">{user?.plan}</span> plan.</p>
                    {user?.plan === 'Free' && (
                         <Link to="/pricing" className="font-semibold text-cyan-400 hover:text-cyan-300">
                            Upgrade Plan &rarr;
                        </Link>
                    )}
                </div>

                {/* Events List */}
                <div className="bg-slate-800 shadow-xl rounded-lg">
                     <div className="px-6 py-4 border-b border-slate-700">
                        <h2 className="text-xl font-semibold text-white">Your Events</h2>
                    </div>
                    <div className="divide-y divide-slate-700">
                       {mockEvents.map(event => (
                           <div key={event.id} className="p-6 flex justify-between items-center hover:bg-slate-700/50 transition-colors">
                               <div>
                                   <p className="font-semibold text-white">{event.name}</p>
                                   <p className="text-sm text-slate-400">{event.attendees} Attendees &middot; {new Date(event.date).toLocaleDateString()}</p>
                               </div>
                               <div>
                                   {/* In a real app, this would link to /app/planner/evt1 */}
                                   <Link to="/app/planner" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">View/Edit</Link>
                               </div>
                           </div>
                       ))}
                       {mockEvents.length === 0 && (
                           <div className="text-center p-12 text-slate-400">
                               <p>You haven't created any events yet.</p>
                               <Link to="/app/planner" className="mt-4 inline-block font-semibold text-emerald-400 hover:text-emerald-300">Create your first one now!</Link>
                           </div>
                       )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;

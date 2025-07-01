import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 font-sans">
            <PublicNavbar />
            <main>
                {/* Hero Section */}
                <section className="text-center py-20 sm:py-32 px-4">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 leading-tight">
                        The Smartest Way to Plan Your Networking Event
                    </h1>
                    <p className="max-w-3xl mx-auto mt-6 text-lg sm:text-xl text-slate-300">
                        Stop manually creating seating charts. Our intelligent algorithm generates optimized schedules to maximize unique connections, saving you hours of planning.
                    </p>
                    <div className="mt-10">
                        <Link 
                            to="/signup"
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-lg shadow-xl text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                        >
                            Create Your First Event for Free
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-slate-800/50">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose Us?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard 
                                title="Intelligent Seating" 
                                description="Our core algorithm ensures participants meet as many new people as possible, eliminating awkward repeat conversations."
                            />
                            <FeatureCard 
                                title="Sponsor Support" 
                                description="Easily designate sponsors as static table hosts while other attendees rotate, giving sponsors maximum exposure."
                            />
                            <FeatureCard 
                                title="Effortless Setup" 
                                description="Upload your attendee list from a spreadsheet, set your parameters, and get your perfect schedule in seconds."
                            />
                        </div>
                    </div>
                </section>

                 {/* How It Works Section */}
                <section className="py-20">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-12">Get Your Schedule in 3 Simple Steps</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                           <StepCard num="1" title="Upload Your List" description="Import your attendees and sponsors from a .csv or .xlsx file. We'll automatically detect names and roles." />
                           <StepCard num="2" title="Define Your Event" description="Set the number of tables and rounds. Our app provides smart defaults to get you started quickly." />
                           <StepCard num="3" title="Generate & Export" description="Click generate and receive a perfectly optimized schedule. Export to PDF or CSV for easy sharing." />
                        </div>
                    </div>
                </section>

            </main>
            <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-800">
                <p>&copy; {new Date().getFullYear()} SpeedNetworkingPlanner.com. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{title: string, description: string}> = ({title, description}) => (
    <div className="bg-slate-800 p-8 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-emerald-400 mb-3">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
);

const StepCard: React.FC<{num: string, title: string, description: string}> = ({num, title, description}) => (
     <div className="bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 border-emerald-500">
        <span className="text-4xl font-bold text-slate-600">{num}</span>
        <h3 className="text-xl font-semibold text-white mt-2 mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
    </div>
)

export default HomePage;

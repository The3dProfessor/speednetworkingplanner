import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import { AuthContext } from '../context/AuthContext';

const PricingPage: React.FC = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChoosePlan = (plan: 'Free' | 'Pro' | 'Business' | 'Enterprise') => {
        // In a real app, this would redirect to a Stripe checkout page for paid plans.
        // For the MVP, we just log the user in with the chosen plan.
        login(plan);
    };

    return (
         <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 font-sans">
            <PublicNavbar />
            <main className="container mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Find the Perfect Plan</h1>
                    <p className="mt-4 text-lg text-slate-300">Start for free, and upgrade as your events grow.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <PlanCard
                        planName="Free"
                        price="0"
                        description="For small, casual events."
                        features={[
                            "1 event / month",
                            "Up to 50 attendees",
                            "Up to 5 tables",
                            "Up to 5 rounds",
                        ]}
                        onChoose={() => handleChoosePlan('Free')}
                        ctaText="Get Started"
                    />
                    <PlanCard
                        planName="Pro"
                        price="19"
                        description="For professionals and growing communities."
                        features={[
                            "5 events / month",
                            "Up to 100 attendees",
                            "Up to 12 tables",
                            "Up to 12 rounds",
                        ]}
                        onChoose={() => handleChoosePlan('Pro')}
                        ctaText="Choose Pro"
                        isFeatured
                    />
                     <PlanCard
                        planName="Business"
                        price="49"
                        description="For frequent event organizers."
                        features={[
                           "Unlimited events",
                           "Up to 200 attendees",
                           "Up to 25 tables",
                           "Up to 25 rounds",
                        ]}
                        onChoose={() => handleChoosePlan('Business')}
                        ctaText="Choose Business"
                    />
                    <PlanCard
                        planName="Enterprise"
                        price="Custom"
                        isCustom
                        description="For large-scale needs and full control."
                        features={[
                           "Everything in Business",
                           "Attendee Management CRM",
                           "Priority Support",
                           "Custom Integrations",
                        ]}
                        onChoose={() => alert('Contact us for enterprise pricing!')}
                        ctaText="Contact Us"
                    />
                </div>
            </main>
             <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-800">
                <p>&copy; {new Date().getFullYear()} SpeedNetworkingPlanner.com. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

interface PlanCardProps {
    planName: string;
    price: string;
    description: string;
    features: string[];
    onChoose: () => void;
    ctaText: string;
    isFeatured?: boolean;
    isCustom?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ planName, price, description, features, onChoose, ctaText, isFeatured, isCustom }) => (
    <div className={`bg-slate-800 rounded-lg shadow-lg p-8 flex flex-col ${isFeatured ? 'border-2 border-emerald-500' : 'border-2 border-transparent'}`}>
        <h3 className="text-2xl font-bold text-white">{planName}</h3>
        <p className="text-slate-400 mt-2">{description}</p>
        <div className="my-6">
            <span className="text-5xl font-extrabold text-white">${price}</span>
            {!isCustom && <span className="text-slate-400">/mo</span>}
        </div>
        <ul className="space-y-3 text-slate-300 mb-8 flex-grow">
            {features.map(feature => (
                 <li key={feature} className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button
          onClick={onChoose}
          className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors ${isFeatured ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
        >
            {ctaText}
        </button>
    </div>
);


export default PricingPage;

import React, { useState } from 'react';
import { User } from '../types';

interface SignOnPageProps {
    onLoginSuccess: (user: User) => void;
}

const SignOnPage: React.FC<SignOnPageProps> = ({ onLoginSuccess }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: login, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data);
            } else {
                setError(data.message || 'Invalid username or password. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTryOut = () => {
        const trialUser: User = {
            id: 'trialuser',
            username: 'Guest User',
            role: 'trial',
            plan: { name: 'Trial Plan', cost: 'Free', details: 'Limited access to explore features.' },
            email: 'guest@lynixity.x10.bz',
            sip: 'N/A',
            billing: { status: 'On Time', owes: 0 },
            chat_enabled: false,
            ai_enabled: false,
            localmail_enabled: false,
        };
        onLoginSuccess(trialUser);
    };

    return (
        <div className="flex flex-col items-center justify-center text-gray-800 dark:text-white p-6">
            <style>{`
                html:not(.dark) input:-webkit-autofill,
                html:not(.dark) input:-webkit-autofill:hover, 
                html:not(.dark) input:-webkit-autofill:focus, 
                html:not(.dark) input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #e5e7eb inset !important; /* bg-gray-200 */
                    -webkit-text-fill-color: #1f2937 !important; /* text-gray-800 */
                }
                html.dark input:-webkit-autofill,
                html.dark input:-webkit-autofill:hover, 
                html.dark input:-webkit-autofill:focus, 
                html.dark input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px #374151 inset !important; /* bg-gray-700 */
                    -webkit-text-fill-color: #ffffff !important;
                }
            `}</style>
            <div className="w-full max-w-md bg-white/70 dark:bg-black/30 p-8 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Access Your Lynix Account</h2>
                <p className="text-center text-gray-600 dark:text-gray-200 mb-8">
                    Sign in using your Phone Number, TalkID, Email, or Admin ID to continue.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
                    <div className="flex items-center space-x-4">
                        <label htmlFor="login" className="w-20 text-right font-semibold">Login :</label>
                        <input
                            id="login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            placeholder="Enter your ID"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="password" className="w-20 text-right font-semibold">Passwd :</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                            placeholder="Enter your password"
                            disabled={isLoading}
                        />
                    </div>
                     <div className="pt-4 space-y-3">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                         <button 
                            type="button"
                            onClick={handleTryOut}
                            disabled={isLoading}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Try Out
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignOnPage;
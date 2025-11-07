

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Page, User, GuestSession, Alert } from './types';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ContactPage from './components/ContactPage';
import SignOnPage from './components/SignOnPage';
import ProfilePage from './components/ProfilePage';
import AdminPage from './components/AdminPage';
import SoftphonePage from './components/SoftphonePage';
import PhonePage from './components/PhonePage';
import LynxAiPage from './components/LynxAiPage';
import AiChoiceModal from './components/AiChoiceModal';
import ChatPage from './components/ChatPage';
import LocalMailPage from './components/LocalMailPage';
import NotepadPage from './components/NotepadPage';
import CalculatorPage from './components/CalculatorPage';
import ContactsListPage from './components/ContactsListPage';
import VoiceServerPage from './components/VoiceServerPage';
import Footer from './components/Footer';
import { useTheme } from './components/ThemeContext';
import { CallProvider } from './components/CallProvider';

const GUEST_SESSION_KEY = 'lynixGuestAiSession';
const GUEST_MESSAGE_LIMIT = 50;
const GUEST_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

const AppContent: React.FC = () => {
    const { theme } = useTheme();
    const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [isAiChoiceModalOpen, setIsAiChoiceModalOpen] = useState(false);
    const [loginRedirectToAi, setLoginRedirectToAi] = useState(false);
    const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const alertIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const handleLoginSuccess = useCallback((user: User) => {
        setLoggedInUser(user);
        if (loginRedirectToAi && user.ai_enabled) {
            setCurrentPage(Page.LynxAI);
            setLoginRedirectToAi(false);
        } else if (user.role === 'admin') {
            setCurrentPage(Page.Admin);
        } else {
            setCurrentPage(Page.Profile);
        }
    }, [loginRedirectToAi]);

    const handleSignOut = useCallback(() => {
        setLoggedInUser(null);
        setCurrentPage(Page.Home);
        setAlerts([]);
        if (alertIntervalRef.current) {
            clearInterval(alertIntervalRef.current);
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        if (!loggedInUser) return;
        try {
            const response = await fetch('/api/chat?type=alerts', {
                headers: {
                    'x-user-id': loggedInUser.id,
                }
            });
            if(response.ok) {
                const data = await response.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error("Failed to fetch alerts:", error);
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (loggedInUser && loggedInUser.chat_enabled) {
            fetchAlerts(); // Initial fetch
            alertIntervalRef.current = window.setInterval(fetchAlerts, 5000); // Poll every 5 seconds
        } else {
            if (alertIntervalRef.current) {
                clearInterval(alertIntervalRef.current);
            }
        }
        return () => {
            if (alertIntervalRef.current) {
                clearInterval(alertIntervalRef.current);
            }
        };
    }, [loggedInUser, fetchAlerts]);

    const handleAlertClick = async (alert: Alert) => {
        // Find the user associated with the alert to open the chat
        try {
            const res = await fetch('/api/chat?type=users');
            const users = await res.json();
            const targetUser = users.find((u: User) => u.id === alert.sender_id);
            if (targetUser) {
                 setCurrentPage(Page.Chat);
            }
             // Mark as read by re-fetching alerts (the API marks them as read)
            fetchAlerts();
        } catch (e) { console.error(e) }
    };

    const handleSelectLynixId = () => {
        setLoginRedirectToAi(true);
        setCurrentPage(Page.SignOn);
        setIsAiChoiceModalOpen(false);
    };

    const handleSelectGuest = () => {
        let session: GuestSession | null = null;
        try {
            const storedSession = localStorage.getItem(GUEST_SESSION_KEY);
            if (storedSession) {
                const parsed = JSON.parse(storedSession) as GuestSession;
                if (parsed.resetTime && Date.now() > parsed.resetTime) {
                    session = { responsesLeft: GUEST_MESSAGE_LIMIT, resetTime: null };
                } else {
                    session = parsed;
                }
            } else {
                session = { responsesLeft: GUEST_MESSAGE_LIMIT, resetTime: null };
            }
        } catch (error) {
            console.error("Failed to read guest session from localStorage:", error);
            session = { responsesLeft: GUEST_MESSAGE_LIMIT, resetTime: null };
        }
        
        localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
        setGuestSession(session);
        setCurrentPage(Page.LynxAI);
        setIsAiChoiceModalOpen(false);
    };
    
    const handleGuestMessageSent = () => {
        setGuestSession(prevSession => {
            if (!prevSession) return null;
            
            const isFirstMessage = prevSession.resetTime === null;
            const newResetTime = isFirstMessage ? Date.now() + GUEST_SESSION_DURATION : prevSession.resetTime;
            const newResponsesLeft = Math.max(0, prevSession.responsesLeft - 1);
            
            const newSession: GuestSession = {
                responsesLeft: newResponsesLeft,
                resetTime: newResetTime
            };

            localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(newSession));
            return newSession;
        });
    };

    const canAccessAI = loggedInUser && loggedInUser.ai_enabled && (loggedInUser.role === 'admin' || loggedInUser.role === 'standard') && loggedInUser.billing.status !== 'Suspended';
    const canAccessChat = loggedInUser && loggedInUser.chat_enabled;
    const canAccessLocalMail = loggedInUser && loggedInUser.localmail_enabled;

    useEffect(() => {
        if (currentPage !== Page.LynxAI) {
            setGuestSession(null);
        }
    }, [currentPage]);
    
    const renderPage = () => {
        switch (currentPage) {
            case Page.Home: return <HomePage />;
            case Page.Contact: return <ContactPage />;
            case Page.SignOn: return <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Profile: return loggedInUser ? <ProfilePage user={loggedInUser} onSignOut={handleSignOut} setCurrentPage={setCurrentPage} /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Admin: return loggedInUser?.role === 'admin' ? <AdminPage /> : <HomePage />;
            case Page.Softphone: return loggedInUser ? <SoftphonePage /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Phone: return loggedInUser ? <PhonePage currentUser={loggedInUser} /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.VoiceServer: return loggedInUser ? <VoiceServerPage currentUser={loggedInUser} /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Chat: return canAccessChat ? <ChatPage currentUser={loggedInUser} /> : <HomePage />;
            case Page.LocalMail: return canAccessLocalMail ? <LocalMailPage currentUser={loggedInUser} /> : <HomePage />;
            case Page.Notepad: return loggedInUser ? <NotepadPage currentUser={loggedInUser} /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Calculator: return loggedInUser ? <CalculatorPage /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.Contacts: return loggedInUser ? <ContactsListPage currentUser={loggedInUser} /> : <SignOnPage onLoginSuccess={handleLoginSuccess} />;
            case Page.LynxAI:
                if (canAccessAI) {
                    return <LynxAiPage user={loggedInUser} />;
                }
                if (guestSession) {
                    return <LynxAiPage guestSession={guestSession} onGuestMessageSent={handleGuestMessageSent} />;
                }
                return <HomePage />;
            default: return <HomePage />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 dark:bg-gradient-to-br dark:from-cyan-600 dark:via-teal-500 dark:to-green-400 dark:text-white font-sans transition-colors duration-300">
            <style>{`
                :root { --ai-pulse-color: rgba(30, 64, 175, 0.4); }
                html.dark { --ai-pulse-color: rgba(147, 197, 253, 0.4); }

                @keyframes page-transition {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-page-transition { animation: page-transition 0.5s ease-in-out; }

                @keyframes content-fade {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .animate-content-fade { animation: content-fade 0.5s ease-in-out; }

                @keyframes modal-open {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-modal-open { animation: modal-open 0.3s ease-out; }

                @keyframes ai-pulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 var(--ai-pulse-color); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 10px transparent; }
                }
                .animate-ai-pulse { animation: ai-pulse 2.5s infinite; }
            `}</style>
            <Header currentPage={currentPage} setCurrentPage={setCurrentPage} loggedInUser={loggedInUser} onSignOut={handleSignOut} alerts={alerts} onAlertClick={handleAlertClick} />
            <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
                <div key={currentPage} className="animate-page-transition w-full flex items-center justify-center">
                    {renderPage()}
                </div>
            </main>
            { currentPage !== Page.LynxAI && <Footer onOpenAiChoiceModal={() => setIsAiChoiceModalOpen(true)} /> }
            {isAiChoiceModalOpen && (
                <AiChoiceModal 
                    onClose={() => setIsAiChoiceModalOpen(false)}
                    onSelectLynixId={handleSelectLynixId}
                    onSelectGuest={handleSelectGuest}
                />
            )}
        </div>
    );
};

const App: React.FC = () => (
    <CallProvider>
        <AppContent />
    </CallProvider>
);


export default App;
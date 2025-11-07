import React, { useState, useEffect, useRef } from 'react';
import { Page, User, Alert } from '../types';
import { LynixLogo, BellIcon, WebIcon, AppsIcon, SoftphoneIcon, ChatIcon, MailIcon, NotepadIcon, CalculatorIcon, ContactsIcon, PhoneIcon, VoiceServerIcon } from './icons';
import AlertsDropdown from './AlertsDropdown';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    loggedInUser: User | null;
    onSignOut: () => void;
    alerts: Alert[];
    onAlertClick: (alert: Alert) => void;
}

const NavButton: React.FC<{
    page: Page;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
}> = ({ page, currentPage, setCurrentPage, children, icon }) => {
    const isActive = currentPage === page;
    const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform flex items-center justify-center gap-2";
    const activeClasses = "bg-blue-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-gray-800 shadow-lg scale-105";
    const inactiveClasses = "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white hover:scale-105";

    return (
        <button
            onClick={() => setCurrentPage(page)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span>{children}</span>
            {isActive && <span className="hidden md:inline"> (You're on this Page)</span>}
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, loggedInUser, onSignOut, alerts, onAlertClick }) => {
    const baseButtonClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white hover:scale-105";
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const alertsRef = useRef<HTMLDivElement>(null);
    const [isWebOpen, setIsWebOpen] = useState(false);
    const webRef = useRef<HTMLDivElement>(null);
    const [isAppsOpen, setIsAppsOpen] = useState(false);
    const appsRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
                setIsAlertsOpen(false);
            }
            if (webRef.current && !webRef.current.contains(event.target as Node)) {
                setIsWebOpen(false);
            }
            if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
                setIsAppsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAppClick = (page: Page) => {
        setCurrentPage(page);
        setIsAppsOpen(false);
    };

    return (
        <header className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm text-gray-800 dark:text-white p-4 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setCurrentPage(Page.Home)}
                    >
                        <div className="flex items-center gap-2 bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-transform hover:scale-105">
                            <LynixLogo />
                            <span className="text-xl font-bold">Lynix</span>
                        </div>
                    </div>
                    <h1 className="text-lg sm:text-2xl font-bold hidden sm:block">Lynix Technology and Coding</h1>
                </div>
                
                <nav className="flex items-center gap-2 md:gap-4">
                    {/* Web Dropdown */}
                    <div className="relative" ref={webRef}>
                        <button
                            onClick={() => setIsWebOpen(prev => !prev)}
                            className={`${baseButtonClasses} flex items-center gap-2`}
                        >
                            <WebIcon />
                            <span>Web</span>
                        </button>
                        {isWebOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50 animate-content-fade overflow-hidden border dark:border-gray-600">
                                <a 
                                    href="https://darshanjoshuakesavaruban.fwscheckout.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    Buy a product
                                </a>
                                <a 
                                    href="https://sites.google.com/gcp.lynixity.x10.bz/myportal/home" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    MyPortal
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Apps Dropdown */}
                    {loggedInUser && (
                        <div className="relative" ref={appsRef}>
                            <button
                                onClick={() => setIsAppsOpen(prev => !prev)}
                                className={`${baseButtonClasses} flex items-center gap-2`}
                            >
                                <AppsIcon />
                                <span>Apps</span>
                            </button>
                            {isAppsOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50 animate-content-fade overflow-hidden border dark:border-gray-600">
                                    <button onClick={() => handleAppClick(Page.Softphone)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><SoftphoneIcon /> <span>Softphone</span></button>
                                    <button onClick={() => handleAppClick(Page.Phone)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><PhoneIcon /> <span>Phone</span></button>
                                    <button onClick={() => handleAppClick(Page.VoiceServer)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><VoiceServerIcon /> <span>Voice Server</span></button>
                                    {loggedInUser.chat_enabled && <button onClick={() => handleAppClick(Page.Chat)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><ChatIcon /> <span>Chat</span></button>}
                                    {loggedInUser.localmail_enabled && <button onClick={() => handleAppClick(Page.LocalMail)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><MailIcon /> <span>LocalMail</span></button>}
                                    <button onClick={() => handleAppClick(Page.Notepad)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><NotepadIcon /> <span>Notepad</span></button>
                                    <button onClick={() => handleAppClick(Page.Contacts)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><ContactsIcon /> <span>Contacts</span></button>
                                    <button onClick={() => handleAppClick(Page.Calculator)} className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition"><CalculatorIcon /> <span>Calculator</span></button>
                                </div>
                            )}
                        </div>
                    )}

                    <NavButton page={Page.Contact} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                        Contact Us
                    </NavButton>
                    <NavButton page={Page.Home} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                        Home
                    </NavButton>
                    <ThemeToggle />
                    {loggedInUser ? (
                        <>
                            {loggedInUser.role === 'admin' && (
                                <NavButton page={Page.Admin} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                                    Admin
                                </NavButton>
                            )}
                            <NavButton page={Page.Profile} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                                Profile
                            </NavButton>
                             <div className="relative" ref={alertsRef}>
                                <button onClick={() => setIsAlertsOpen(prev => !prev)} className="relative p-2 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition">
                                    <BellIcon />
                                    {alerts.length > 0 && (
                                        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {alerts.length}
                                        </span>
                                    )}
                                </button>
                                {isAlertsOpen && <AlertsDropdown alerts={alerts} onAlertClick={onAlertClick} onClose={() => setIsAlertsOpen(false)} />}
                            </div>
                            <button onClick={onSignOut} className="px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 transform bg-purple-600 hover:bg-purple-700 hover:scale-105">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <NavButton page={Page.SignOn} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                            Sign On
                        </NavButton>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
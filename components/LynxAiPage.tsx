import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage, GuestSession } from '../types';
import { runChat } from '../services/geminiService';
import { LynxAiLogo, SimpleUserIcon, SendIcon } from './icons';

interface LynxAiPageProps {
    user?: User | null;
    guestSession?: GuestSession;
    onGuestMessageSent?: () => void;
}

const LynxAiPage: React.FC<LynxAiPageProps> = ({ user, guestSession, onGuestMessageSent }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const isGuestMode = !user;
    const hasStartedChat = messages.length > 0;
    const guestResponsesLeft = guestSession?.responsesLeft ?? 0;
    const isInputDisabled = isLoading || (isGuestMode && guestResponsesLeft <= 0);
    const username = user?.username || 'Guest';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchGreeting = async () => {
            setIsLoading(true);
            const greeting = await runChat(`Please introduce yourself to ${username}.`);
            setMessages([{ sender: 'gemini', text: greeting }]);
            setIsLoading(false);
        };
        fetchGreeting();
    }, [username]);

    const handleSend = async () => {
        if (input.trim() === '' || isInputDisabled) return;

        if (isGuestMode) {
            onGuestMessageSent?.();
        }

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseText = await runChat(input);
            const geminiMessage: ChatMessage = { sender: 'gemini', text: responseText };
            setMessages(prev => [...prev, geminiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'gemini', text: "Sorry, I'm having trouble connecting right now." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const getPlaceholderText = () => {
        if (isGuestMode && guestResponsesLeft <= 0) {
            return "You've reached your message limit.";
        }
        return "Type to message LynxAI";
    };

    return (
        <div className="w-full h-[calc(100vh-150px)] bg-white dark:bg-black flex flex-col text-gray-800 dark:text-white font-sans transition-colors duration-300">
            <header className="w-full p-4 bg-gray-100 dark:bg-gray-900/50 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                <div className="text-gray-500 dark:text-gray-400 font-mono text-sm">LynxAI powered by Gemini 2.5 Flash</div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold">{username}</span>
                    <SimpleUserIcon />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
                {!hasStartedChat ? (
                    <div className="text-center animate-content-fade">
                        <LynxAiLogo />
                        <h1 className="text-5xl font-bold mt-4">LynxAI</h1>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl h-full overflow-y-auto space-y-4 pr-2">
                        {messages.map((msg, index) => (
                             <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'gemini' && <div className="w-8 h-8 bg-purple-600 rounded-full flex-shrink-0"></div>}
                                <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                           <div className="flex items-start gap-4 justify-start">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex-shrink-0"></div>
                                <div className="max-w-xl p-4 rounded-2xl bg-gray-200 dark:bg-gray-800">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            <footer className="w-full p-4 flex flex-col items-center border-t border-gray-200 dark:border-gray-800">
                {isGuestMode && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Responses left: {guestResponsesLeft}</p>}
                <div className="w-full max-w-4xl flex items-center bg-gray-200 dark:bg-gray-800 rounded-xl p-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={getPlaceholderText()}
                        className="flex-1 bg-transparent p-3 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 disabled:placeholder-gray-600"
                        disabled={isInputDisabled}
                    />
                    <button onClick={handleSend} disabled={isInputDisabled || input.trim() === ''} className="p-3 text-gray-800 dark:text-white disabled:text-gray-400 dark:disabled:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition rounded-full bg-gray-300 dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-800">
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LynxAiPage;
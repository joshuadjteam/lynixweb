import React, { useState, useEffect, useCallback } from 'react';
import { User, LocalMailMessage } from '../types';
import { MailIcon, SendIcon } from './icons';

type MailboxView = 'inbox' | 'sent' | 'compose';

// Moved MailItem outside to prevent re-creation on re-renders
const MailItem: React.FC<{ 
    message: LocalMailMessage; 
    selectedMessage: LocalMailMessage | null;
    onSelect: (message: LocalMailMessage) => void;
    view: 'inbox' | 'sent';
}> = ({ message, selectedMessage, onSelect, view }) => (
    <button
        onClick={() => onSelect(message)}
        className={`w-full text-left p-3 border-b border-gray-200 dark:border-gray-700 transition ${
            selectedMessage?.id === message.id ? 'bg-purple-600/20 dark:bg-purple-600/30' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
        } ${!message.is_read && view === 'inbox' ? 'font-bold' : ''}`}
    >
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{view === 'sent' ? `To: ${message.recipient_username}` : `From: ${message.sender_username}`}</span>
            <span>{new Date(message.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-gray-800 dark:text-white truncate">{message.subject}</p>
    </button>
);

// Moved MessageView outside
const MessageView: React.FC<{ selectedMessage: LocalMailMessage | null; view: 'inbox' | 'sent' }> = ({ selectedMessage, view }) => {
    if (!selectedMessage) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <MailIcon />
                <p className="mt-2 text-lg">Select a message to read</p>
            </div>
        )
    }
    return (
        <div className="p-4 h-full flex flex-col">
            <header className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedMessage.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {view === 'sent' ? `To: ${selectedMessage.recipient_username}` : `From: ${selectedMessage.sender_username}`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(selectedMessage.timestamp).toLocaleString()}</p>
            </header>
            <div className="flex-grow py-4 overflow-y-auto whitespace-pre-wrap">
                {selectedMessage.body}
            </div>
        </div>
    )
};

// Moved ComposeView outside
const ComposeView: React.FC<{ currentUser: User; onMailSent: () => void; }> = ({ currentUser, onMailSent }) => {
    const [recipients, setRecipients] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSend = async () => {
        setError('');
        setSuccess('');
        if (!recipients.trim() || !subject.trim() || !body.trim()) {
            setError("All fields are required.");
            return;
        }
        setIsSending(true);
        try {
            const response = await fetch('/api/localmail', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id
                },
                body: JSON.stringify({ recipients: recipients.split(',').map(r => r.trim()), subject, body })
            });
            if (response.ok) {
                setSuccess('Message sent successfully!');
                // Clear form and switch view after a delay
                setTimeout(() => {
                    onMailSent();
                }, 1500);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to send message.");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <header className="pb-3 mb-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Compose New Mail</h3>
            </header>
            <div className="space-y-4">
                 {error && <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
                 {success && <p className="text-green-400 text-sm bg-green-900/30 p-2 rounded">{success}</p>}
                <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">To (e.g., user@lynixity.x10.bz, separated by commas)</label>
                    <input value={recipients} onChange={e => setRecipients(e.target.value)} type="text" className="w-full bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-purple-500 outline-none" />
                </div>
                 <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} type="text" className="w-full bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-purple-500 outline-none" />
                </div>
                 <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Message</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="w-full bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 resize-none border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-purple-500 outline-none"></textarea>
                </div>
            </div>
            <footer className="mt-auto pt-4 flex justify-end">
                <button onClick={handleSend} disabled={isSending} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-500">
                    <SendIcon />
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </footer>
        </div>
    )
};


const LocalMailPage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [view, setView] = useState<MailboxView>('inbox');
    const [messages, setMessages] = useState<LocalMailMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<LocalMailMessage | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/localmail?view=${view}`, {
                headers: { 'x-user-id': currentUser.id }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${view}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [view, currentUser.id]);

    useEffect(() => {
        if (view !== 'compose') {
            fetchMessages();
        }
    }, [view, fetchMessages]);
    
    const handleViewChange = (newView: MailboxView) => {
        setView(newView);
        setSelectedMessage(null);
    }

    return (
        <div className="w-full h-[calc(100vh-150px)] max-w-7xl mx-auto bg-white/70 dark:bg-black/30 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white flex">
            <aside className="w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setView('compose')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition">Compose</button>
                    <nav className="flex justify-around mt-4">
                        <button onClick={() => handleViewChange('inbox')} className={`font-semibold ${view === 'inbox' ? 'text-purple-500 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Inbox</button>
                        <button onClick={() => handleViewChange('sent')} className={`font-semibold ${view === 'sent' ? 'text-purple-500 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Sent</button>
                    </nav>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? <p className="p-4 text-center text-gray-400">Loading...</p> : messages.map(msg => 
                        <MailItem 
                            key={msg.id} 
                            message={msg} 
                            selectedMessage={selectedMessage}
                            onSelect={setSelectedMessage}
                            view={view as 'inbox' | 'sent'}
                        />)
                    }
                </div>
            </aside>
            <main className="w-3/4">
                {view === 'compose' ? 
                    <ComposeView currentUser={currentUser} onMailSent={() => handleViewChange('sent')} /> 
                    : <MessageView selectedMessage={selectedMessage} view={view} />
                }
            </main>
        </div>
    );
};

export default LocalMailPage;

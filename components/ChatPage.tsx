

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, DirectMessage } from '../types';
import { SendIcon, SimpleUserIcon, ChatIcon } from './icons';

interface ChatPageProps {
    currentUser: User;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/chat?type=users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.filter((u: User) => u.id !== currentUser.id));
                }
            } catch (error) {
                console.error("Failed to fetch users for chat:", error);
            }
        };
        fetchUsers();
    }, [currentUser.id]);

    const fetchMessages = useCallback(async () => {
        if (!selectedUser) return;
        try {
            const response = await fetch(`/api/chat?type=messages&senderId=${currentUser.id}&recipientId=${selectedUser.id}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    }, [selectedUser, currentUser.id]);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 3 seconds
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);
    
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedUser || isLoading) return;
        
        setIsLoading(true);
        try {
            await fetch('/api/chat?type=messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUser.id,
                    recipientId: selectedUser.id,
                    text: newMessage,
                }),
            });
            setNewMessage('');
            await fetchMessages(); // Fetch immediately after sending
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="w-full h-[calc(100vh-150px)] max-w-7xl mx-auto bg-white/70 dark:bg-black/30 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white flex">
            {/* User List Panel */}
            <aside className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Contacts</h2>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user)}
                            className={`w-full text-left p-4 flex items-center gap-3 transition ${selectedUser?.id === user.id ? 'bg-purple-600/20 dark:bg-purple-600/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}
                        >
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold">{user.username}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Chat Panel */}
            <main className="w-2/3 flex flex-col">
                {selectedUser ? (
                    <>
                        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white">
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold">{selectedUser.username}</h2>
                        </header>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender_id !== currentUser.id && (
                                        <div className="w-8 h-8 bg-gray-500 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white">
                                            {selectedUser.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className={`max-w-md p-3 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={`Message ${selectedUser.username}...`}
                                    className="flex-1 bg-transparent p-2 resize-none focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                                    rows={1}
                                    disabled={isLoading}
                                ></textarea>
                                <button onClick={handleSendMessage} disabled={!newMessage.trim() || isLoading} className="p-3 disabled:text-gray-400 dark:disabled:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition rounded-full bg-gray-200 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                    <SendIcon />
                                </button>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <ChatIcon />
                        <p className="mt-2 text-lg">Select a user to start chatting</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatPage;
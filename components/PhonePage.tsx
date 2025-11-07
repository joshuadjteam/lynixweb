import React, { useState, useEffect } from 'react';
import { User, CallStatus } from '../types';
import { useCall } from './CallProvider';
import { LargeUserIcon, MuteIcon, UnmuteIcon } from './icons';

interface PhonePageProps {
    currentUser: User;
}

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const PhonePage: React.FC<PhonePageProps> = ({ currentUser }) => {
    const { activeCall, initiateCall, endCall } = useCall();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        // Mock function to pass user ID to the context/API calls
        localStorage.setItem('currentUser_id', currentUser.id);

        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/phone?type=users', {
                    headers: { 'x-user-id': currentUser.id }
                });
                if (response.ok) {
                    setUsers(await response.json());
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };
        fetchUsers();

        return () => localStorage.removeItem('currentUser_id');
    }, [currentUser.id]);

    useEffect(() => {
        let timer: number | undefined;
        if (activeCall?.status === CallStatus.Active && activeCall.answered_at) {
            const answeredTime = new Date(activeCall.answered_at).getTime();
            timer = window.setInterval(() => {
                setCallDuration(Math.floor((Date.now() - answeredTime) / 1000));
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(timer);
    }, [activeCall]);

    const handleCall = () => {
        if (selectedUserId) {
            initiateCall(selectedUserId);
        }
    };
    
    const getCallStatusText = () => {
        if (!activeCall) return '';
        const otherUser = activeCall.caller_username === currentUser.username 
            ? activeCall.callee_username 
            : activeCall.caller_username;

        switch (activeCall.status) {
            case CallStatus.Ringing:
                return `ringing ${otherUser}... | 00:00:00`;
            case CallStatus.Active:
                return `${otherUser} | ${formatDuration(callDuration)}`;
            default:
                return '';
        }
    };

    if (activeCall) {
        return (
            <div className="w-full h-[80vh] bg-blue-500 text-white flex flex-col items-center justify-between p-8 rounded-lg">
                <div className="w-full flex justify-between items-start">
                    <LargeUserIcon />
                    <div className="text-right">
                        <h2 className="text-5xl font-bold">{currentUser.username}</h2>
                        <p className="text-xl mt-2">{getCallStatusText()}</p>
                    </div>
                </div>
                <div className="w-full flex justify-between items-end">
                    <div className="flex flex-col gap-4">
                        <button className="bg-gray-500/50 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition">Add this user</button>
                        <button className="bg-gray-500/50 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition">Message User</button>
                        <button onClick={() => setIsMuted(!isMuted)} className="bg-gray-500/50 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
                           {isMuted ? <UnmuteIcon/> : <MuteIcon/>} {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                    </div>
                    <button onClick={endCall} className="bg-red-600 hover:bg-red-700 text-white text-4xl font-bold py-8 px-24 rounded-2xl transition transform hover:scale-105">
                        End
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white/70 dark:bg-black/30 p-8 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white">
            <h2 className="text-3xl font-bold text-center mb-6">LynixTalk Dialer</h2>
            <div className="flex flex-col gap-4">
                <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="" disabled>Select a user to call</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                </select>
                <button
                    onClick={handleCall}
                    disabled={!selectedUserId}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Call
                </button>
            </div>
        </div>
    );
};

export default PhonePage;

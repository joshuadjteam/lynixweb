import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, VoiceServerRoom, VoiceServerParticipant, VoiceServerMessage } from '../types';
import { UnmuteIcon } from './icons'; // Using unmute icon as a base for PTT

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// FIX: Create a browser-compatible function to decode base64 string to Uint8Array,
// since `Buffer` is not available in the browser environment.
const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

interface VoiceServerPageProps {
    currentUser: User;
}

const VoiceServerPage: React.FC<VoiceServerPageProps> = ({ currentUser }) => {
    const [rooms, setRooms] = useState<VoiceServerRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<VoiceServerRoom | null>(null);
    const [participants, setParticipants] = useState<VoiceServerParticipant[]>([]);
    const [messages, setMessages] = useState<VoiceServerMessage[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const participantPollRef = useRef<number | null>(null);
    const messagePollRef = useRef<number | null>(null);
    const lastMessageTimestampRef = useRef<string>(new Date(0).toISOString());

    const audioPlayerRef = useRef<HTMLAudioElement>(null);
    const audioQueueRef = useRef<VoiceServerMessage[]>([]);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    useEffect(() => {
        const fetchRooms = async () => {
            const res = await fetch('/api/voiceserver?type=rooms', { headers: { 'x-user-id': currentUser.id } });
            if (res.ok) setRooms(await res.json());
        };
        fetchRooms();
    }, [currentUser.id]);

    const playNextInQueue = useCallback(() => {
        if (audioQueueRef.current.length > 0 && audioPlayerRef.current && !isAudioPlaying) {
            setIsAudioPlaying(true);
            const messageToPlay = audioQueueRef.current.shift()!;
            
            const audioBytes = base64ToUint8Array(messageToPlay.audio_data);
            const audioBlob = new Blob([audioBytes], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            audioPlayerRef.current.src = audioUrl;
            audioPlayerRef.current.play().catch(e => {
                 console.error("Audio playback failed:", e);
                 setIsAudioPlaying(false);
            });
            
            // Mark message as "now playing" visually
            setMessages(prev => prev.map(m => m.id === messageToPlay.id ? { ...m, isPlaying: true } : { ...m, isPlaying: false }));
        }
    }, [isAudioPlaying]);
    
     useEffect(() => {
        playNextInQueue();
    }, [messages, isAudioPlaying, playNextInQueue]);

    const handleAudioEnded = () => {
        setIsAudioPlaying(false);
    };

    const pollParticipants = useCallback(async (roomId: string) => {
        const res = await fetch(`/api/voiceserver?type=participants&roomId=${roomId}`, { headers: { 'x-user-id': currentUser.id } });
        if(res.ok) setParticipants(await res.json());
    }, [currentUser.id]);

    const pollMessages = useCallback(async (roomId: string) => {
        const res = await fetch(`/api/voiceserver?type=messages&roomId=${roomId}&since=${lastMessageTimestampRef.current}`, { headers: { 'x-user-id': currentUser.id } });
        if (res.ok) {
            const newMessages: VoiceServerMessage[] = await res.json();
            if (newMessages.length > 0) {
                setMessages(prev => [...prev, ...newMessages]);
                audioQueueRef.current.push(...newMessages);
                playNextInQueue();
                lastMessageTimestampRef.current = newMessages[newMessages.length - 1].created_at;
            }
        }
    }, [currentUser.id, playNextInQueue]);

    const joinRoom = useCallback(async (room: VoiceServerRoom) => {
        setSelectedRoom(room);
        setParticipants([]);
        setMessages([]);
        audioQueueRef.current = [];
        lastMessageTimestampRef.current = new Date(0).toISOString();

        await fetch('/api/voiceserver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
            body: JSON.stringify({ roomId: room.id, action: 'join' }),
        });
        
        pollParticipants(room.id);
        pollMessages(room.id);

        participantPollRef.current = window.setInterval(() => pollParticipants(room.id), 10000);
        messagePollRef.current = window.setInterval(() => pollMessages(room.id), 3000);
    }, [currentUser.id, pollParticipants, pollMessages]);
    
    const leaveRoom = useCallback(async () => {
        if (!selectedRoom) return;

        if (participantPollRef.current) clearInterval(participantPollRef.current);
        if (messagePollRef.current) clearInterval(messagePollRef.current);
        
        await fetch('/api/voiceserver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
            body: JSON.stringify({ roomId: selectedRoom.id, action: 'leave' }),
        });
        setSelectedRoom(null);

    }, [currentUser.id, selectedRoom]);

    useEffect(() => {
        return () => { // Cleanup on component unmount
            if (selectedRoom) leaveRoom();
        };
    }, [selectedRoom, leaveRoom]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioBase64 = await blobToBase64(audioBlob);
                if (selectedRoom) {
                    await fetch('/api/voiceserver?type=message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
                        body: JSON.stringify({ roomId: selectedRoom.id, audioData: audioBase64 }),
                    });
                }
                 stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied:", err);
            alert("Microphone access is required to send voice messages.");
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return (
        <div className="w-full h-[calc(100vh-150px)] max-w-7xl mx-auto bg-white/70 dark:bg-black/30 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white flex">
            {/* Room List */}
            <aside className="w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Voice Servers</h2>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {rooms.map(room => (
                        <button key={room.id} onClick={() => joinRoom(room)} className={`w-full text-left p-4 flex items-center gap-3 transition ${selectedRoom?.id === room.id ? 'bg-purple-600/20 dark:bg-purple-600/50' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                            <span className="font-semibold">{room.name}</span>
                        </button>
                    ))}
                </div>
            </aside>
            
            {/* Main Panel */}
            <main className="w-3/4 flex flex-col">
                {!selectedRoom ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <UnmuteIcon />
                        <p className="mt-2 text-lg">Select a server to join</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{selectedRoom.name} ({participants.length})</h2>
                            <button onClick={leaveRoom} className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded text-sm transition text-white">Leave</button>
                        </header>
                        <div className="flex flex-grow overflow-hidden">
                            <div className="w-2/3 p-4 overflow-y-auto space-y-3">
                                <h3 className="font-bold mb-2 text-lg">Activity</h3>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`p-2 rounded-lg flex items-center gap-2 ${ (msg as any).isPlaying ? 'bg-blue-500/30' : 'bg-gray-200/50 dark:bg-gray-700/50' }`}>
                                        <div className="w-8 h-8 bg-gray-500 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">{msg.sender_username.charAt(0)}</div>
                                        <span><span className="font-semibold">{msg.sender_username}</span> sent a voice message.</span>
                                    </div>
                                ))}
                                {messages.length === 0 && <p className="text-sm text-gray-400">No voice messages yet.</p>}
                            </div>
                            <div className="w-1/3 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                                <h3 className="font-bold mb-2 text-lg">Participants</h3>
                                {participants.map(p => (
                                    <div key={p.user_id} className="flex items-center gap-2 p-1">
                                         <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                         <span>{p.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {isRecording ? "Recording..." : "Hold to Talk"}
                            </p>
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onMouseLeave={stopRecording} // Stop if mouse leaves button area
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}
                            >
                                <UnmuteIcon />
                            </button>
                        </footer>
                    </div>
                )}
            </main>
            <audio ref={audioPlayerRef} onEnded={handleAudioEnded} />
        </div>
    );
};

export default VoiceServerPage;
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, Call, CallStatus } from '../types';
import IncomingCallModal from './IncomingCallModal';

interface CallContextType {
    activeCall: Call | null;
    initiateCall: (calleeId: string) => Promise<void>;
    answerCall: () => Promise<void>;
    endCall: () => Promise<void>;
    declineCall: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};

// A mock hook to get the current user. In a real app, this would come from a real auth context.
const useAuth = (): { user: User | null } => {
    // This is a placeholder. We need a way to get the logged-in user.
    // Since App.tsx manages the user state, we'll pass it down or use a proper AuthContext.
    // For now, this is a limitation we'll address by assuming the user ID is available when calling context methods.
    // Let's assume the user ID is passed via headers for API calls.
    return { user: null };
};

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [incomingCall, setIncomingCall] = useState<Call | null>(null);
    const pollIntervalRef = useRef<number | null>(null);

    const getUserId = () => {
        // This is a mock function. In a real app, this would come from a secure source.
        // For now, we will rely on API calls being authenticated on the server via headers.
        return localStorage.getItem('currentUser_id'); // Example of getting it from storage
    };

    const pollCallStatus = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch('/api/phone?type=status', {
                headers: { 'x-user-id': userId }
            });
            if (response.ok) {
                const callData: Call | null = await response.json();
                
                if (callData) {
                     if (callData.status === CallStatus.Ringing) {
                        setIncomingCall(callData);
                    }
                    setActiveCall(callData);
                } else {
                    setActiveCall(null);
                    setIncomingCall(null);
                }
            }
        } catch (error) {
            console.error("Error polling call status:", error);
        }
    }, []);

    useEffect(() => {
        // This is a simplified approach. A real app would use WebSockets.
        pollIntervalRef.current = window.setInterval(pollCallStatus, 3000); // Poll every 3 seconds
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [pollCallStatus]);

    const initiateCall = async (calleeId: string) => {
        const userId = getUserId();
        if (!userId) return;

        const response = await fetch('/api/phone?type=call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
            body: JSON.stringify({ calleeId }),
        });
        if (response.ok) {
            const callData = await response.json();
            setActiveCall(callData);
        }
    };
    
    const updateCallStatus = async (callId: number, status: CallStatus) => {
         const userId = getUserId();
         if (!userId) return;

         await fetch(`/api/phone?id=${callId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
            body: JSON.stringify({ status }),
         });
         pollCallStatus(); // Re-fetch status immediately
    }

    const answerCall = async () => {
        if (!incomingCall) return;
        setIncomingCall(null);
        await updateCallStatus(incomingCall.id, CallStatus.Active);
    };

    const endCall = async () => {
        if (!activeCall) return;
        await updateCallStatus(activeCall.id, CallStatus.Ended);
        setActiveCall(null);
    };

    const declineCall = async () => {
        if (!incomingCall) return;
        await updateCallStatus(incomingCall.id, CallStatus.Declined);
        setIncomingCall(null);
    };

    return (
        <CallContext.Provider value={{ activeCall, initiateCall, answerCall, endCall, declineCall }}>
            {children}
            {incomingCall && (
                <IncomingCallModal
                    call={incomingCall}
                    onAnswer={answerCall}
                    onDecline={declineCall}
                />
            )}
        </CallContext.Provider>
    );
};

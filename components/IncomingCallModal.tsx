import React from 'react';
import { Call } from '../types';

interface IncomingCallModalProps {
    call: Call;
    onAnswer: () => void;
    onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ call, onAnswer, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-modal-open">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold">Incoming Call</h2>
                <p className="text-lg mt-2">{call.caller_username}</p>
                <div className="mt-6 flex justify-around">
                    <button
                        onClick={onDecline}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition transform hover:scale-105"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAnswer}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition transform hover:scale-105"
                    >
                        Answer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;

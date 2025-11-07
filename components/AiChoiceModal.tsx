import React from 'react';
import { CloseIcon, UserIcon } from './icons';

interface AiChoiceModalProps {
    onClose: () => void;
    onSelectLynixId: () => void;
    onSelectGuest: () => void;
}

const AiChoiceModal: React.FC<AiChoiceModalProps> = ({ onClose, onSelectLynixId, onSelectGuest }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-modal-open" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col relative text-gray-800 dark:text-white" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold">Access LynxAI</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><CloseIcon /></button>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    <p className="text-center text-gray-600 dark:text-gray-300">
                        Choose how you'd like to access our AI assistant, Mason.
                    </p>
                    <button
                        onClick={onSelectLynixId}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
                    >
                        <UserIcon />
                        <span>Use your LynixID</span>
                    </button>
                    <button
                        onClick={onSelectGuest}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiChoiceModal;
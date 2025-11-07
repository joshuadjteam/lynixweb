import React from 'react';
import { Alert } from '../types';
import { ChatIcon } from './icons';

interface AlertsDropdownProps {
    alerts: Alert[];
    onAlertClick: (alert: Alert) => void;
    onClose: () => void;
}

const AlertsDropdown: React.FC<AlertsDropdownProps> = ({ alerts, onAlertClick, onClose }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-content-fade">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-800 dark:text-white">Notifications</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No new messages.</p>
                    </div>
                ) : (
                    alerts.map((alert, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                onAlertClick(alert);
                                onClose();
                            }}
                            className="w-full text-left p-3 flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                                <ChatIcon />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">New message from {alert.sender_username}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">"{alert.message_snippet}"</p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default AlertsDropdown;
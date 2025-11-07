import React from 'react';
import { YouTubeIcon, TikTokIcon, InstagramIcon, QuestionMarkIcon } from './icons';

interface FooterProps {
    onOpenAiChoiceModal: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenAiChoiceModal }) => {
    return (
        <>
            <footer className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm text-gray-800 dark:text-white p-4 mt-auto">
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center">
                    <p className="text-gray-600 dark:text-gray-400">&copy; 2025 Lynix Technology and Coding. All Rights Reserved.</p>
                    <div className="flex gap-4 mt-4 sm:mt-0">
                        <a href="https://www.youtube.com/@DarCodr" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><YouTubeIcon /></a>
                        <a href="https://www.tiktok.com/@darcodr" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><TikTokIcon /></a>
                        <a href="https://www.instagram.com/dar_codr" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"><InstagramIcon /></a>
                    </div>
                </div>
            </footer>
             <button
                onClick={onOpenAiChoiceModal}
                className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 z-50 animate-ai-pulse bg-white dark:bg-gray-800 text-blue-800 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-400 dark:focus:ring-blue-500"
                aria-label="Open AI Assistant"
            >
                <QuestionMarkIcon />
            </button>
        </>
    );
};

export default Footer;
import React from 'react';

const SoftphonePage: React.FC = () => {
    return (
        <div className="w-full h-[80vh] max-w-7xl mx-auto bg-white/70 dark:bg-black/30 p-4 sm:p-6 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white flex flex-col">
            <div className="mb-4 text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Web Softphone</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Enter your SIP credentials into the client below to connect and make calls.
                </p>
            </div>
             <div className="bg-blue-900/50 border border-blue-500 text-blue-200 p-4 rounded-lg mb-4 text-center">
                <p className="font-bold">Important: Your browser will ask for microphone permission.</p>
                <p>You must click <span className="font-bold">"Allow"</span> for the softphone to work.</p>
                <p className="text-sm mt-2">If you see a "User Denied Media Access" error, please click the lock icon (🔒) in your browser's address bar to change the microphone permission for this site.</p>
            </div>
            <div className="flex-grow w-full h-full rounded-lg overflow-hidden">
                <iframe
                    src="https://tryit.iptel.org/"
                    className="w-full h-full border-0"
                    title="JsSIP Softphone Client"
                    allow="microphone"
                ></iframe>
            </div>
        </div>
    );
};

export default SoftphonePage;
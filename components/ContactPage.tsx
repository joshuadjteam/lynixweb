import React from 'react';
import Clock from './Clock';

const ContactPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-gray-800 dark:text-white p-6">
            <div className="w-full max-w-4xl bg-white/70 dark:bg-black/30 p-8 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Get in Touch</h2>
                <p className="text-lg text-center mb-8">
                    We're here to help and answer any question you might have. We look forward to hearing from you.
                </p>
                <div className="space-y-4 text-left text-lg md:text-xl font-light">
                    <p><span className="font-semibold">Email :</span> admin@lynixity.x10.bz</p>
                    <p><span className="font-semibold">Phone :</span> +1 (647) 247 - 4844 / +1 (585) 286 - 3299</p>
                    <p><span className="font-semibold">LynixTalk ID :</span> 0470055990 (extension 1 → 7)</p>
                </div>
                <Clock />
            </div>
        </div>
    );
};

export default ContactPage;
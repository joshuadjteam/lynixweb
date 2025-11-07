
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timerId);
        };
    }, []);

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="text-center text-lg md:text-xl font-mono mt-8">
            <p>The Time is {formattedTime} / {formattedDate}</p>
        </div>
    );
};

export default Clock;
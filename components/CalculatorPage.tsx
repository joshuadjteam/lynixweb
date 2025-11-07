import React, { useState } from 'react';

const CalculatorPage: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');

    const handleButtonClick = (value: string) => {
        if (value === 'C') {
            setDisplay('0');
            setExpression('');
        } else if (value === '=') {
            try {
                // A better approach would be to parse and calculate, but this is a quick implementation for a non-production app.
                // eslint-disable-next-line no-eval
                const result = eval(expression.replace(/[^-()\d/*+.]/g, ''));
                setDisplay(String(result));
                setExpression(String(result));
            } catch {
                setDisplay('Error');
                setExpression('');
            }
        } else {
            if (display === '0' || display === 'Error') {
                setDisplay(value);
                setExpression(value);
            } else {
                setDisplay(display + value);
                setExpression(expression + value);
            }
        }
    };

    const buttons = [
        'C', '(', ')', '/',
        '7', '8', '9', '*',
        '4', '5', '6', '-',
        '1', '2', '3', '+',
        '0', '.', '='
    ];

    const getButtonClass = (btn: string) => {
        if (['/', '*', '-', '+', '='].includes(btn)) {
            return 'bg-amber-500 hover:bg-amber-600 text-white';
        }
        if (btn === 'C') {
            return 'bg-red-500 hover:bg-red-600 text-white';
        }
        return 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white';
    };

    return (
        <div className="w-full max-w-sm mx-auto bg-white/70 dark:bg-black/30 p-6 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">Calculator</h2>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 text-right text-3xl font-mono text-gray-800 dark:text-white overflow-x-auto">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-2">
                {buttons.map((btn) => (
                    <button
                        key={btn}
                        onClick={() => handleButtonClick(btn)}
                        className={`text-2xl font-bold p-4 rounded-lg transition transform hover:scale-105 ${getButtonClass(btn)} ${btn === '=' ? 'col-span-2' : ''}`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CalculatorPage;

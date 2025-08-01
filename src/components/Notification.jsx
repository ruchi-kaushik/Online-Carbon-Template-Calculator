import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const notificationIcons = {
    success: <CheckCircle className="text-white" size={24} />,
    error: <XCircle className="text-white" size={24} />,
    info: <Info className="text-white" size={24} />,
};

const notificationColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};

const Notification = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`fixed top-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${notificationColors[type]}`}>
            <div className="mr-3">
                {notificationIcons[type]}
            </div>
            <div>
                <p className="font-bold">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                <p>{message}</p>
            </div>
            <button onClick={onDismiss} className="ml-4 p-1 rounded-full hover:bg-white/20">
                <XCircle size={20} />
            </button>
        </div>
    );
};

export default Notification;

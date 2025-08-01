import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Action</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        <XCircle size={20} /> Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 shadow-md"
                    >
                        <CheckCircle size={20} /> Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;

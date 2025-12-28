import React, { useEffect, useState } from 'react';
import { Check, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        return () => setIsVisible(false);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation
        setTimeout(onClose, 300);
    };

    const icons = {
        success: <Check size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div className={`toast toast-${type} ${isVisible ? 'show' : ''}`}>
            <div className="toast-icon">
                {icons[type] || icons.info}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={handleClose}>
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;

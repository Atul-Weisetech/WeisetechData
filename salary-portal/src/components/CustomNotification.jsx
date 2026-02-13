import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";


function CustomNotification({ notification, onClose }) {
  const { type, message, show } = notification;

  useEffect(() => {
    if (show) {
      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 text-green-800 border-green-300',
          icon: <CheckCircle className="text-green-600" size={22} />,
          iconColor: 'text-green-600',
          closeButton: 'text-green-600 hover:text-green-800 hover:bg-green-100'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 text-yellow-800 border-yellow-300',
          icon: <AlertTriangle className="text-yellow-600" size={22} />,
          iconColor: 'text-yellow-600',
          closeButton: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100'
        };
      case 'error':
        return {
          container: 'bg-red-50 text-red-800 border-red-300',
          icon: <XCircle className="text-red-600" size={22} />,
          iconColor: 'text-red-600',
          closeButton: 'text-red-600 hover:text-red-800 hover:bg-red-100'
        };
      default:
        return {
          container: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: <Info className="text-blue-600" size={22} />,
          iconColor: 'text-blue-600',
          closeButton: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-md w-full">
      <div
        className={`${styles.container} border-2 rounded-lg shadow-lg p-4 flex items-start gap-3 transition-all duration-300`}
      >
        <span className={`text-xl ${styles.iconColor} flex-shrink-0`}>
          {styles.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`${styles.closeButton} flex-shrink-0 p-1 rounded transition-colors text-lg font-bold leading-none`}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default CustomNotification;

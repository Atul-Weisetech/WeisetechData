import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomNotification from '../components/CustomNotification';
import CustomConfirmDialog from '../components/CustomConfirmDialog';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    message: ''
  });

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showNotification = useCallback((type, message) => {
    setNotification({
      show: true,
      type,
      message
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);

  const showSuccess = useCallback((message) => {
    showNotification('success', message);
  }, [showNotification]);

  const showWarning = useCallback((message) => {
    showNotification('warning', message);
  }, [showNotification]);

  const showError = useCallback((message) => {
    showNotification('error', message);
  }, [showNotification]);

  // Custom confirm dialog replacement
  const showConfirm = useCallback((message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmDialog({
      show: true,
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        if (onCancel) onCancel();
      },
      confirmText,
      cancelText
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, show: false }));
  }, []);

  const value = {
    showNotification,
    hideNotification,
    showSuccess,
    showWarning,
    showError,
    showConfirm
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <CustomNotification notification={notification} onClose={hideNotification} />
      <CustomConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />
    </NotificationContext.Provider>
  );
};

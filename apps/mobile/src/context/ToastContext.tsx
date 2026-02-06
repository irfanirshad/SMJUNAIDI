import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  toastKey: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const [toastKey, setToastKey] = useState(0);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    // If a toast is currently visible, hide it first
    if (toastVisible) {
      setToastVisible(false);
      // Wait for hide animation to complete, then show new toast
      setTimeout(() => {
        setToastMessage(message);
        setToastType(type);
        setToastKey(prev => prev + 1); // Force re-render with new key
        setToastVisible(true);
      }, 100);
    } else {
      // Show toast immediately if none is visible
      setToastMessage(message);
      setToastType(type);
      setToastKey(prev => prev + 1);
      setToastVisible(true);
    }
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        toastVisible,
        toastMessage,
        toastType,
        toastKey,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

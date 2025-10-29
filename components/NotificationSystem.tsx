import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { Notification } from '../types';
import { BellIcon, CheckCircle2, XCircle, InfoIcon, XIcon, Loader2 } from './Icons';
import { formatRelativeTime } from '../utils';

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  unreadCount: number;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const NotificationToasts: React.FC<{ toasts: Notification[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <div key={toast.id} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {toast.type === 'success' && <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden="true" />}
                                {toast.type === 'error' && <XCircle className="h-6 w-6 text-red-400" aria-hidden="true" />}
                                {toast.type === 'info' && <InfoIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />}
                            </div>
                            <div className="ml-3 w-0 flex-1 pt-0.5">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{toast.code ? `[${toast.code}]` : 'Notification'}</p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{toast.message}</p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button onClick={() => removeToast(toast.id)} className="rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                    <span className="sr-only">Close</span>
                                    <XIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setToasts(prev => [...prev, newNotification]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  useEffect(() => {
      if (toasts.length > 0) {
          const timer = setTimeout(() => {
              setToasts(prev => prev.slice(0, prev.length - 1));
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [toasts]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = { notifications, addNotification, unreadCount, markAllAsRead };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToasts toasts={toasts} removeToast={removeToast} />
    </NotificationContext.Provider>
  );
};

const NotificationPanel: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { notifications } = useNotifications();
    const panelRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={panelRef} className="absolute top-full mt-2 right-0 w-96 max-w-[95vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 z-50 flex flex-col max-h-[70vh]">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                <h3 className="font-semibold">Notifications</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center py-12 text-gray-500 dark:text-gray-400">No notifications yet.</p>
                ) : (
                    <ul className="divide-y dark:divide-gray-700">
                        {notifications.slice(0, 20).map(n => (
                            <li key={n.id} className="p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex-shrink-0">
                                    {n.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    {n.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                                    {n.type === 'info' && <InfoIcon className="h-5 w-5 text-blue-500" />}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {n.code && <span className="font-bold mr-1">[{n.code}]</span>}
                                        {n.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(n.timestamp)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export const NotificationBell: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const { unreadCount, markAllAsRead } = useNotifications();

    const togglePanel = () => {
        setIsPanelOpen(prev => {
            if (!prev) markAllAsRead();
            return !prev;
        });
    };

    return (
        <div className="relative">
            <button onClick={togglePanel} className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Toggle notifications">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>
            {isPanelOpen && <NotificationPanel onClose={() => setIsPanelOpen(false)} />}
        </div>
    );
}
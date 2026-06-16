import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './useAuth';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unshownModals, setUnshownModals] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnshownModals([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      const [allRes, unshownRes] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnshown()
      ]);
      
      const allNotifs = allRes.data?.data || [];
      setNotifications(allNotifs);
      setUnreadCount(allNotifs.filter(n => !n.is_read).length);
      setUnshownModals(unshownRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markModalShown = async (id) => {
    try {
      await notificationService.markModalShown(id);
      setUnshownModals(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to mark modal shown', error);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unshownModals, 
      unreadCount, 
      markModalShown, 
      markRead, 
      markAllRead,
      refresh: fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

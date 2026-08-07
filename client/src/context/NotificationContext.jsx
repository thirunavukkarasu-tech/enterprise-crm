import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { notificationService } from '../services/notificationService.js';

const NotificationContext = createContext(undefined);

const NOTIFICATION_PAGE_SIZE = 15;

/**
 * Owns the Notification Center's data: a page of recent notifications plus
 * an always-accurate unread count (used for the Navbar bell badge on every
 * page, not just when the dropdown is open).
 *
 * Real-time updates: `notification:new` events from the socket are
 * prepended to the in-memory list and increment the unread count directly,
 * without a refetch — the server already sent the full notification
 * payload, so there's nothing left to fetch. A toast also surfaces it
 * immediately even if the dropdown isn't open. If the socket is
 * disconnected, notifications still arrive correctly on the next
 * `GET /notifications` (e.g. on page load) — the socket is a live-update
 * optimization, never the source of truth.
 */
export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationService.list({ limit: NOTIFICATION_PAGE_SIZE });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNew = (notification) => {
      setItems((prev) => [notification, ...prev].slice(0, NOTIFICATION_PAGE_SIZE));
      setUnreadCount((c) => c + 1);
      toast(notification.title, { icon: '🔔' });
    };

    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  const markAsRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationService.markAsRead(id);
    } catch {
      // Non-critical — the next fetchNotifications() call will reconcile
      // if this silently failed, so no error toast for a background op.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const previousItems = items;
    const previousCount = unreadCount;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      setItems(previousItems);
      setUnreadCount(previousCount);
      toast.error('Could not mark all as read. Please try again.');
    }
  }, [items, unreadCount]);

  const value = useMemo(
    () => ({ items, unreadCount, isLoading, error, refetch: fetchNotifications, markAsRead, markAllAsRead }),
    [items, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

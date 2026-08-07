import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../services/api.js';

const SocketContext = createContext(undefined);

/**
 * One Socket.IO connection per authenticated session, established after
 * login/session-restore (once an access token exists) and torn down on
 * logout. Mirrors the server's auth model (`realtime/socket.js`): the same
 * JWT access token used for REST calls is passed via `auth.token` on the
 * handshake, so there's no separate credential to manage.
 *
 * Exposes only the raw socket instance + connection status — consumers
 * (NotificationContext) attach their own event listeners rather than this
 * context knowing about specific event names, keeping it a thin transport
 * layer rather than growing app-specific logic.
 */
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }

    const instance = io('/', {
      path: '/socket.io',
      auth: { token: getAccessToken() },
      withCredentials: true,
    });

    instance.on('connect', () => setIsConnected(true));
    instance.on('disconnect', () => setIsConnected(false));

    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
    // Reconnect if the identity changes (e.g. a different user logs in
    // without a full page reload); the access token itself can rotate
    // silently via the axios refresh interceptor without needing a new
    // socket, so it's intentionally not a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};

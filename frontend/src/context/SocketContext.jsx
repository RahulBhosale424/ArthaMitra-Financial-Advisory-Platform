import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Only connect once a user is logged in — the socket handshake requires
    // a JWT (see backend chatSocket.js), so there's nothing to connect with
    // before authentication.
    if (!user) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    const newSocket = io(API_URL, { auth: { token } });

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    // Storing the socket instance in state (not a ref) is deliberate: a ref
    // update alone wouldn't trigger a re-render, so components reading
    // `socket` from this context via useContext would keep seeing the stale
    // (null) value even after the connection succeeded. State guarantees
    // consumers re-render with the live socket instance.
    setSocket(newSocket);

    // Clean up the connection when the component unmounts or the user
    // changes/logs out — an orphaned socket connection is a memory/resource
    // leak worth avoiding deliberately, not an accident to discover later.
    return () => newSocket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

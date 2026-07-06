import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../utils/server-config';
import { fetchAlerts } from '../utils/alerts-api';

const WebSocketContext = createContext(null);

const BRANCH_ID = import.meta.env.VITE_BRANCH_ID || '4';

function WebSocketProvider({ children }) {
  const socketRef = useRef(null);
  const roomListenersRef = useRef(new Set());
  const reservationListenersRef = useRef(new Set());
  const alertListenersRef = useRef(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const prevAlertCountRef = useRef(null);

  // Fetch the real count from the DB. Exposed so the admin layout can
  // re-sync after login — the mount-time fetch fails silently on the
  // public site / login screen (no auth yet) and would leave the badge at 0.
  const refreshAlertCount = useCallback(() => {
    fetchAlerts()
      .then((data) => {
        const count = data.total ?? 0;
        setAlertCount(count);
        prevAlertCountRef.current = count;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshAlertCount();
  }, [refreshAlertCount]);

  useEffect(() => {
    const socketUrl = SOCKET_SERVER_URL;

    console.log('🔌 [WebSocketProvider] Connecting to:', socketUrl);

    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true });

    socketRef.current.on('connect', () => {
      console.log('✅ [WebSocketProvider] Connected:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ [WebSocketProvider] Disconnected:', reason);
      setIsConnected(false);
    });

    // Handle rooms_updated
    socketRef.current.on('rooms_updated', (data) => {
      console.log('📢 [WebSocketProvider] Rooms updated:', data);
      if (Number(data.branch_id) === Number(BRANCH_ID)) {
        roomListenersRef.current.forEach(callback => {
          try { callback(data); } catch (e) { console.error(e); }
        });
      }
    });

    // Handle new_reservation
    socketRef.current.on('new_reservation', (data) => {
      console.log('🔔 [WebSocketProvider] New reservation:', data);
      if (Number(data.branch_id) === Number(BRANCH_ID)) {
        reservationListenersRef.current.forEach(callback => {
          try { callback(data); } catch (e) { console.error(e); }
        });
      }
    });

    // Handle alerts_updated
    socketRef.current.on('alerts_updated', (data) => {
      console.log('🚨 [WebSocketProvider] Alerts updated:', data);
      if (Number(data.branch_id) === Number(BRANCH_ID)) {
        const newCount = data.alert_count ?? 0;
        const prev = prevAlertCountRef.current;
        // Update shared badge count
        setAlertCount(newCount);
        prevAlertCountRef.current = newCount;
        // Browser notification only when count increases
        if (prev !== null && newCount > prev && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Hotel PMS — New Alert', {
            body: `${newCount} unresolved alert${newCount !== 1 ? 's' : ''} require${newCount === 1 ? 's' : ''} attention.`,
            icon: '/favicon.ico',
          });
        }
        // Notify page-level subscribers (e.g. AdminAlerts full reload)
        alertListenersRef.current.forEach(callback => {
          try { callback(data); } catch (e) { console.error(e); }
        });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const subscribe = useCallback((callback, type = 'rooms') => {
    const targetSet =
      type === 'reservations' ? reservationListenersRef.current :
      type === 'alerts' ? alertListenersRef.current :
      roomListenersRef.current;
    targetSet.add(callback);
    return () => targetSet.delete(callback);
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe, alertCount, refreshAlertCount }}>
      {children}
    </WebSocketContext.Provider>
  );
}

function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

export { WebSocketProvider, useWebSocketContext };

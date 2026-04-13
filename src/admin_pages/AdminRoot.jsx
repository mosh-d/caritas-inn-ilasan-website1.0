import { useWebSocketContext } from '../context/WebSocketContext';
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { IoClose } from 'react-icons/io5';
import { verifyToken } from "../utils/auth";
import AdminNavBar from "../components/shared/AdminNavBar";
import AdminTopBar from "../components/shared/AdminTopBar";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function AdminRootLayout() {
  const [hasNewReservation, setHasNewReservation] = useState(false);
  const { subscribe } = useWebSocketContext();

  const handleNewReservation = useCallback(() => {
    setHasNewReservation(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe(handleNewReservation, 'reservations');
    return unsubscribe;
  }, [subscribe, handleNewReservation]);

  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await verifyToken();
        setIsAuthenticated(!!userData);

        // Redirect to login if not authenticated and not on login page
        if (!userData && !isLoginPage) {
          window.location.href = "/admin";
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
        if (!isLoginPage) {
          window.location.href = "/admin";
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isLoginPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
      {/* ── New Reservation Notification ── */}
      {hasNewReservation && (
        <div className="fixed top-34 right-6 z-[200] animate-notification">
          <div className="bg-white border-l-4 border-[var(--emphasis)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 rounded-lg flex items-center gap-6 min-w-[320px] backdrop-blur-sm bg-white/95 animate-bounce-subtle">
            <div className="bg-[var(--emphasis)]/10 p-3 rounded-full">
              <span className="text-3xl" style={{ color: 'var(--emphasis)' }}>🔔</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 leading-tight">New Reservation</h4>
              <p className="text-gray-600 text-lg">You have a new reservation</p>
            </div>
            <button 
              onClick={() => setHasNewReservation(false)}
              className="text-gray-400 hover:text-[var(--emphasis)] transition-colors p-1"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>
      )}

        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If on login page and already authenticated, redirect to overview
  if (isLoginPage && isAuthenticated) {
    return <Navigate to="/admin/overview" replace />;
  }

  // Don't show layout for login page
  if (isLoginPage) {
    return <Outlet />;
  }

  // Show protected layout for authenticated users
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── New Reservation Notification ── */}
      {hasNewReservation && (
        <div className="fixed top-34 right-6 z-[200] animate-notification">
          <div className="bg-white border-l-4 border-[var(--emphasis)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 rounded-lg flex items-center gap-6 min-w-[320px] backdrop-blur-sm bg-white/95 animate-bounce-subtle">
            <div className="bg-[var(--emphasis)]/10 p-3 rounded-full">
              <span className="text-3xl" style={{ color: 'var(--emphasis)' }}>🔔</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 leading-tight">New Reservation</h4>
              <p className="text-gray-600 text-lg">You have a new reservation</p>
            </div>
            <button 
              onClick={() => setHasNewReservation(false)}
              className="text-gray-400 hover:text-[var(--emphasis)] transition-colors p-1"
            >
              <IoClose size={24} />
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm">
        <AdminTopBar />
      </header>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminNavBar />
        <main className="flex-1 overflow-auto p-0 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

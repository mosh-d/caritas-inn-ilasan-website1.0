import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import AdminMobileMenu from "./AdminMobileMenu";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";
import { useWebSocketContext } from "../../context/WebSocketContext";

function AlertCountBadge({ count, active }) {
  if (!count) return null;
  return (
    <span
      className={`ml-auto text-sm font-bold rounded-full px-2 py-0.5 min-w-[2rem] text-center leading-tight ${
        active ? "bg-white text-[color:var(--emphasis)]" : "bg-red-600 text-white"
      }`}
    >
      {count}
    </span>
  );
}

export default function AdminNavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { alertCount, refreshAlertCount } = useWebSocketContext();

  // The sidebar only renders inside the authenticated admin layout, so this
  // re-syncs the badge after login (the provider's mount-time fetch happens
  // before auth and fails silently).
  useEffect(() => {
    refreshAlertCount();
  }, [refreshAlertCount]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button - Only shows on mobile */}
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-10 right-10 z-40 text-2xl text-white bg-[color:var(--emphasis)] p-3 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Desktop Sidebar - Hidden on mobile */}
      <nav className="hidden md:block h-full">
        <ul className="flex flex-col px-[1.6rem] py-[3rem] gap-[0.6rem] h-full min-w-[26rem] bg-[color:var(--accent)]/70">
          {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end, showAlertBadge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 pt-[1.1rem] pb-[0.7rem] rounded-xl text-2xl font-bold tracking-wide transition-all ${
                    isActive
                      ? "bg-[color:var(--emphasis)] text-white shadow-md"
                      : "text-[color:var(--black)] hover:bg-white/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} className="shrink-0 -mt-1" />
                    <span>{label}</span>
                    {showAlertBadge && <AlertCountBadge count={alertCount} active={isActive} />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Menu */}
      <AdminMobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}

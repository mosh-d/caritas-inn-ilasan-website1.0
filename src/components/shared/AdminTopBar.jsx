import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../../assets/caritas-logo-2.png";
import { logout, getStoredStaffRole, getStoredBranch } from "../../utils/auth";
import StatusBadge from "./StatusBadge";

// Branch names in the DB are stored as "<Brand> <Location>" (e.g. "Caritas Inn
// Ilasan") since one branches table spans all three hotel brands. The logo
// above already shows the brand, so strip a known brand prefix here and show
// only the location — otherwise the brand would appear twice on screen.
const KNOWN_BRAND_PREFIXES = ["Five Clover", "Caritas Inn", "Ringruby"];
const branchLocationName = (fullName) => {
  if (!fullName) return fullName;
  const match = KNOWN_BRAND_PREFIXES.find((prefix) =>
    fullName.toLowerCase().startsWith(prefix.toLowerCase()),
  );
  return match ? fullName.slice(match.length).trim() : fullName;
};

export default function AdminTopBar() {
  const navigate = useNavigate();
  const isLogin = window.location.pathname === "/admin";
  const staffRole = getStoredStaffRole();
  const branch = getStoredBranch();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  if (isLogin) return null;

  return (
    <div
      data-component="AdminTopBar"
      className="w-full flex justify-between items-center bg-[color:var(--text-color)] px-6 py-4 shadow-md"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="cursor-pointer px-4 py-2 text-lg font-medium text-white bg-[color:var(--emphasis)] hover:bg-[color:var(--emphasis)]/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--emphasis)] transition-colors"
        >
          Logout
        </button>
        {staffRole && (
          <NavLink to="/admin/account" className="hidden sm:flex items-center gap-2 text-lg text-white/70 hover:text-white transition-colors">
            Signed in as <StatusBadge status={staffRole} />
          </NavLink>
        )}
      </div>
      <div className="w-48 flex-shrink-0">
        <NavLink to="/admin/overview" className="block">
          <img
            src={Logo}
            alt="Five Clover Hotel Logo"
            className="w-full h-auto"
          />
        </NavLink>
        {branch?.name && (
          <p className="text-center text-3xl font-bold tracking-wide text-white mt-1">
            {branchLocationName(branch.name)}
          </p>
        )}
      </div>
      <div className="w-24"></div> {/* Spacer to balance the layout */}
    </div>
  );
}

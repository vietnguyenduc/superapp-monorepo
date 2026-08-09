import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiList,
  FiCalendar,
  FiTool,
  FiBookOpen,
  FiLogOut,
  FiX,
  FiDollarSign,
  FiZap,
} from "react-icons/fi";
import { useAuthContext } from "@superapp/iam";
import { useI18n } from "../../hooks/useI18n";

interface SideNavProps {
  open: boolean;
  onClose: () => void;
}

const SideNav = ({ open, onClose }: SideNavProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { signOut, isTrial } = useAuthContext();

  const links = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: FiGrid },
    { to: "/session", label: t("nav.session"), icon: FiList },
    { to: "/calendar", label: t("nav.calendar"), icon: FiCalendar },
    { to: "/finance", label: t("nav.finance"), icon: FiDollarSign },
    { to: "/practice", label: t("nav.practice"), icon: FiZap },
    { to: "/builder", label: t("nav.builder"), icon: FiTool },
    { to: "/knowledge", label: t("nav.knowledge"), icon: FiBookOpen },
  ];

  const handleLogout = async () => {
    await signOut();
    if (!isTrial) {
      localStorage.removeItem("debt-repayment-auth");
    }
    navigate("/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-r border-black/[0.04] dark:border-white/[0.06] transform transition-transform duration-200 ease-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-black/[0.04] dark:border-white/[0.06] md:hidden">
          <span className="font-semibold text-xl tracking-tight">{t("app.name")}</span>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition-all"
            aria-label={t("common.close")}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex items-center px-6 h-16 border-b border-black/[0.04] dark:border-white/[0.06]">
          <span className="font-semibold text-xl tracking-tight">{t("app.name")}</span>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 4rem)" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            {t("nav.logout")}
          </button>
        </nav>
      </aside>
    </>
  );
};

export default SideNav;

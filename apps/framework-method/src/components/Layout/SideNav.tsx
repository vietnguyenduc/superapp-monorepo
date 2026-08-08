import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiList,
  FiCalendar,
  FiClock,
  FiTool,
  FiBookOpen,
  FiLogOut,
  FiX,
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
    { to: "/history", label: t("nav.history"), icon: FiClock },
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-200 ease-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-gray-800 md:hidden">
          <span className="font-bold text-lg">{t("app.name")}</span>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t("common.close")}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden md:flex items-center px-6 h-16 border-b border-gray-100 dark:border-gray-800">
          <span className="font-bold text-xl">{t("app.name")}</span>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 4rem)" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

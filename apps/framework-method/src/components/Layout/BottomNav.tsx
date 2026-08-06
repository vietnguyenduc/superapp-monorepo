import { NavLink } from "react-router-dom";
import { FiGrid, FiList, FiCheckCircle, FiClock, FiCalendar, FiEdit3 } from "react-icons/fi";
import { useI18n } from "../../hooks/useI18n";

const BottomNav = () => {
  const { t } = useI18n();

  const links = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: FiGrid },
    { to: "/steps", label: t("nav.steps"), icon: FiList },
    { to: "/actions", label: t("nav.actions"), icon: FiCheckCircle },
    { to: "/calendar", label: t("nav.calendar"), icon: FiCalendar },
    { to: "/history", label: t("nav.history"), icon: FiClock },
    { to: "/builder", label: t("nav.builder"), icon: FiEdit3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 md:hidden">
      <div className="max-w-3xl mx-auto grid grid-cols-6 h-16">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

import { NavLink } from "react-router-dom";
import { FiGrid, FiList, FiCalendar, FiDollarSign, FiZap } from "react-icons/fi";
import { useI18n } from "../../hooks/useI18n";

const BottomNav = () => {
  const { t } = useI18n();

  const links = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: FiGrid },
    { to: "/session", label: t("nav.session"), icon: FiList },
    { to: "/calendar", label: t("nav.calendar"), icon: FiCalendar },
    { to: "/finance", label: t("nav.finance"), icon: FiDollarSign },
    { to: "/practice", label: t("nav.practice"), icon: FiZap },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-xl border-t border-black/[0.04] dark:border-white/[0.06] md:hidden">
      <div className="max-w-3xl mx-auto grid grid-cols-5 h-16 pb-safe">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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

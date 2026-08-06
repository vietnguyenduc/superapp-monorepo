import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiChevronLeft, FiHome } from "react-icons/fi";
import { format } from "date-fns";

const SmileyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="15" cy="10" r="1" fill="currentColor" />
    <path d="M8 15c1.5 2 4.5 2 6 0" />
  </svg>
);

const MobileHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const today = format(new Date(), "EEEE, MMM d");

  const stepMatch = location.pathname.match(/\/step\/(\d+)/);
  const stepNumber = stepMatch ? Number(stepMatch[1]) : null;

  if (stepNumber) {
    return (
      <header className="sticky top-0 z-30 bg-[#F7F7FB] dark:bg-gray-950 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/overview")} className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            <FiChevronLeft className="w-5 h-5" /> Back
          </button>
          <span className="text-sm font-medium text-primary-600">Step {stepNumber} of 5</span>
          <div className="w-8" />
        </div>
      </header>
    );
  }

  return (
    <header className="px-4 pt-5 pb-2">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" aria-label="Home" className="w-8 h-8 flex items-center justify-center">
          <FiHome className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        </Link>
        <span className="text-base font-semibold">{today}</span>
        <button className="w-8 h-8 flex items-center justify-center">
          <SmileyIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;

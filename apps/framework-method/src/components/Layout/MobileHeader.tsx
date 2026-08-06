import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiChevronLeft, FiSun, FiHome, FiEye, FiUpload } from "react-icons/fi";
import { useAuthContext } from "@superapp/iam";
import { format } from "date-fns";
import { Button } from "../UI";

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
  const { user } = useAuthContext();

  const today = format(new Date(), "EEEE, MMM d");

  const isBuilder = location.pathname.startsWith("/builder");
  const stepMatch = location.pathname.match(/\/step\/(\d+)/);
  const stepNumber = stepMatch ? Number(stepMatch[1]) : null;

  if (isBuilder) {
    return (
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FiHome className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">The First Principles Method</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Draft
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <FiEye className="w-4 h-4 mr-1" /> Preview
            </Button>
            <Button variant="dark" size="sm">
              <FiUpload className="w-4 h-4 mr-1" /> Publish
            </Button>
            <button className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ml-2">
              <SmileyIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  }

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
        <FiSun className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        <span className="text-base font-semibold">{today}</span>
        <button className="w-8 h-8 flex items-center justify-center">
          <SmileyIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;

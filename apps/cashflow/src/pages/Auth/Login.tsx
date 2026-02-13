import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../../contexts/AuthContext";
import { validateEmail, validatePassword } from "../../utils/validation";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("language");
    return saved || "vi";
  });
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { signIn, loading, error, clearError, isAuthenticated, user, startTrial, isTrial } =
    useAuthContext();

  const copy = {
    vi: {
      title: "Đăng nhập tài khoản",
      subtitle: "Hệ thống quản lý công nợ",
      email: "Email",
      password: "Mật khẩu",
      signIn: "Đăng nhập",
      signingIn: "Đang đăng nhập...",
      or: "hoặc",
      trial: "Dùng thử ngay (không cần đăng nhập)",
    },
    en: {
      title: "Sign in to your account",
      subtitle: "Debt Repayment Management System",
      email: "Email address",
      password: "Password",
      signIn: "Sign in",
      signingIn: "Signing in...",
      or: "or",
      trial: "Try now (no login needed)",
    },
  } as const;
  const tCopy = copy[language as keyof typeof copy] || copy.vi;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isTrial) {
      // Only real sessions auto-redirect
      navigate("/dashboard");
    }
  }, [isAuthenticated, isTrial, user, navigate]);

  // Apply dark mode on login page
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#111827";
      document.body.style.color = "#f3f4f6";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#213547";
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Persist language choice (default VI)
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation || "");
    setPasswordError(passwordValidation || "");

    return !emailValidation && !passwordValidation;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    await signIn(email, password);
    // Navigation is handled by useEffect when isAuthenticated changes
  };

  const handleStartTrial = () => {
    clearError();
    startTrial();
    navigate("/dashboard");
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "vi" ? "en" : "vi";
      if (i18n.language !== next) {
        i18n.changeLanguage(next);
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Chuyển sang sáng" : "Chuyển sang tối"}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/90 shadow-sm text-lg transition transform hover:scale-105 hover:-translate-y-0.5"
        >
          <span aria-hidden>{darkMode ? "🌙" : "☀️"}</span>
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/90 px-3 py-1 shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span className="text-sm">{language.toUpperCase()}</span>
        </button>
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-7 py-8 border border-gray-100 dark:border-gray-700/60">
        <div>
          <h2 className="mt-1 text-center text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
            {tCopy.title}
          </h2>
          <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            {tCopy.subtitle}
          </p>
        </div>
        {isTrial && (
          <div className="rounded-xl border border-blue-100 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-900/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-200 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span>Đang trong phiên dùng thử.</span>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                Vào dashboard
              </button>
            </div>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                {tCopy.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`form-input w-full ${emailError ? "border-red-500" : "border-gray-200"} dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl`}
                placeholder={tCopy.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {tCopy.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`form-input w-full ${passwordError ? "border-red-500" : "border-gray-200"} dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl`}
                placeholder={tCopy.password}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="alert-danger">
              <p>{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {loading ? tCopy.signingIn : tCopy.signIn}
            </button>
          </div>

          <div className="relative">
            <div className="my-2 flex items-center">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="px-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {tCopy.or}
              </span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <button
              type="button"
              onClick={handleStartTrial}
              className="w-full rounded-xl border border-blue-200 dark:border-blue-500/40 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-300 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {tCopy.trial}
            </button>
          </div>
        </form>
      </div>
      <p className="absolute bottom-4 inset-x-0 text-center text-xs text-gray-500 dark:text-gray-400 select-none">
        Quản lí công nợ Ver 1.0 - 1 sản phẩm trong gói vận hành Doanh nghiệp theo yêu cầu.
      </p>
    </div>
  );
};

export default Login;

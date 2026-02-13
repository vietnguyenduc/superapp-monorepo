import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { signIn, loading, error, clearError, isAuthenticated, user, startTrial } =
    useAuthContext();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // All users go directly to dashboard
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

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
  }, [language]);

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
  const toggleLanguage = () => setLanguage((prev) => (prev === "vi" ? "en" : "vi"));

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span className="text-lg" aria-hidden>
            {darkMode ? "🌙" : "☀️"}
          </span>
          <span>{darkMode ? "Dark" : "Light"}</span>
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span className="text-sm">{language.toUpperCase()}</span>
        </button>
      </div>
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-6 py-8">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Debt Repayment Management System
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`form-input w-full ${emailError ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500`}
                placeholder="Email address"
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
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`form-input w-full ${passwordError ? "border-red-500" : ""} dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500`}
                placeholder="Password"
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
              className="btn-primary w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="relative">
            <div className="my-2 flex items-center">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="px-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                or
              </span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <button
              type="button"
              onClick={handleStartTrial}
              className="w-full rounded-md border border-blue-200 dark:border-blue-500/40 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-300 shadow-sm hover:bg-blue-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Dùng thử ngay (không cần đăng nhập)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

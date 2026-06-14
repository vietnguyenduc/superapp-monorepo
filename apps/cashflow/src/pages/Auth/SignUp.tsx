import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@superapp/iam";
import { validateEmail, validatePassword } from "../../utils/validation";

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
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
  const { signUp, loading, error, clearError, isAuthenticated, user } =
    useAuthContext();

  const copy = {
    vi: {
      title: "Tạo tài khoản mới",
      subtitle: "Hệ thống quản lý công nợ",
      fullName: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      signUp: "Đăng ký",
      signingUp: "Đang đăng ký...",
      haveAccount: "Đã có tài khoản? Đăng nhập",
    },
    en: {
      title: "Create your account",
      subtitle: "Debt Repayment Management System",
      fullName: "Full name",
      email: "Email address",
      password: "Password",
      signUp: "Sign up",
      signingUp: "Signing up...",
      haveAccount: "Already have an account? Sign in",
    },
  } as const;
  const tCopy = copy[language as keyof typeof copy] || copy.vi;

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

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

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("language", language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

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

  const validateForm = (): boolean => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation || "");
    setPasswordError(passwordValidation || "");

    return !emailValidation && !passwordValidation;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);

    if (!validateForm()) return;

    const result = await signUp(email, password, fullName.trim() || undefined);

    if (result.error) return;

    if (result.confirmationRequired) {
      setInfoMessage("Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.");
      return;
    }

    setInfoMessage("Đăng ký thành công. Bạn đang được chuyển đến dashboard...");
    navigate("/dashboard");
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

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="sr-only">
                {tCopy.fullName}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                className="form-input w-full border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl"
                placeholder={tCopy.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {tCopy.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
              <p>{typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}

          {infoMessage && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {infoMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {loading ? tCopy.signingUp : tCopy.signUp}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-300 hover:underline"
            >
              {tCopy.haveAccount}
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

export default SignUp;

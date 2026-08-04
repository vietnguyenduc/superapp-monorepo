import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import Button from "../../components/UI/Button";

const ResetPassword: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get("type");
    const code = searchParams.get("code");

    if (type === "recovery" && code) {
      setIsRecovery(true);
      setLoading(true);
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error: exchangeError }) => {
          setLoading(false);
          if (exchangeError) {
            setError(
              "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.",
            );
            setIsRecovery(false);
          }
        });
    }
  }, [searchParams]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
      setEmail("");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Đã cập nhật mật khẩu thành công. Vui lòng đăng nhập lại.");
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-7 py-8 border border-gray-100 dark:border-gray-700/60">
        <h2 className="text-center text-3xl font-medium text-gray-900 dark:text-white tracking-tight">
          {isRecovery ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          {isRecovery
            ? "Nhập mật khẩu mới bên dưới."
            : "Nhập email để nhận link đặt lại mật khẩu."}
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
            {message}
          </div>
        )}

        {!isRecovery ? (
          <form onSubmit={handleSendReset} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="form-input w-full border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Quay lại đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu mới"
              required
              className="form-input w-full border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
              required
              className="form-input w-full border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 rounded-xl"
            />
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

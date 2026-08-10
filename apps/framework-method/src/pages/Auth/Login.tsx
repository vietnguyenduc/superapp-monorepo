import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@superapp/iam";
import { supabase } from "../../services/supabase";
import { Button, Input } from "../../components/UI";
import { useI18n } from "../../hooks/useI18n";

const Login = () => {
  const { t } = useI18n();
  const { startTrial } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl mb-3">
            F
          </div>
          <h1 className="text-2xl font-bold">{t("app.name")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("app.tagline")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={loading} className="w-full">
            {t("nav.login")}
          </Button>
        </form>

        <div className="mt-4 space-y-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              startTrial();
              navigate("/dashboard");
            }}
          >
            {t("login.trial")}
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t("login.noAccount")}{" "}
            <Link to="/signup" className="text-primary-600 hover:underline">
              {t("login.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

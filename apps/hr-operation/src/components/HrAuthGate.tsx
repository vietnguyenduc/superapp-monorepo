import { useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, Loader2, LogIn, ShieldCheck, Users } from 'lucide-react';
import { useAuthContext } from '@superapp/iam';
import { supabase } from '../lib/supabase';

const USERNAME_DOMAIN = 'appforyou.xyz';

const normalizeLogin = (value: string) => {
  const login = value.trim().toLocaleLowerCase('vi');
  return login.includes('@') ? login : `${login}@${USERNAME_DOMAIN}`;
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50 px-4 py-10">
    <div className="w-full max-w-md rounded-2xl border border-white/80 bg-white p-6 shadow-xl shadow-indigo-100/60 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm"><Users className="h-5 w-5" /></div>
        <div><div className="font-semibold text-slate-900">HR Operation</div><div className="text-xs text-slate-500">AppForYou</div></div>
      </div>
      {children}
    </div>
  </div>
);

const LoginForm = () => {
  const { signIn } = useAuthContext();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!login.trim() || !password) {
      setError('Nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setBusy(true);
    const result = await signIn(normalizeLogin(login), password);
    if (result.error) setError('Tên đăng nhập hoặc mật khẩu chưa đúng.');
    setBusy(false);
  };

  return (
    <Shell>
      <h1 className="text-2xl font-semibold text-slate-900">Đăng nhập HR</h1>
      <p className="mt-2 text-sm text-slate-500">Dùng tài khoản được quản trị viên cấp. Có thể nhập tên đăng nhập ngắn hoặc email.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Tên đăng nhập hoặc email
          <input autoFocus autoComplete="username" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Ví dụ: duongquach" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Mật khẩu
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </label>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </Shell>
  );
};

const InitialPasswordChange = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Mật khẩu mới cần ít nhất 8 ký tự.');
    if (password !== confirm) return setError('Hai mật khẩu chưa khớp nhau.');
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false, password_changed_at: new Date().toISOString() },
    });
    if (updateError) {
      setError(updateError.message || 'Không thể đổi mật khẩu.');
      setBusy(false);
      return;
    }
    window.location.reload();
  };

  return (
    <Shell>
      <div className="inline-flex rounded-xl bg-amber-50 p-3 text-amber-700"><KeyRound className="h-5 w-5" /></div>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Tạo mật khẩu riêng</h1>
      <p className="mt-2 text-sm text-slate-500">Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu tạm trước khi xem dữ liệu công ty.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Mật khẩu mới
          <input autoFocus type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </label>
        <label className="block text-sm font-medium text-slate-700">Nhập lại mật khẩu mới
          <input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </label>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {busy ? 'Đang cập nhật...' : 'Đổi mật khẩu và tiếp tục'}
        </button>
      </form>
    </Shell>
  );
};

const HrAuthGate = ({ children }: { children: ReactNode }) => {
  const { loading, user, session, isTrial } = useAuthContext();
  if (loading) return <Shell><div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Đang kiểm tra phiên đăng nhập...</div></Shell>;
  if (!user && !isTrial) return <LoginForm />;
  if (!isTrial && session?.user?.user_metadata?.must_change_password === true) return <InitialPasswordChange />;
  return children;
};

export default HrAuthGate;

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { useAuthContext, useCompany } from '@superapp/iam';
import {
  sharePointService,
  type MicrosoftConnectionState,
} from '../services/sharePointService';

const emptyState: MicrosoftConnectionState = {
  connection: null,
  status: 'disconnected',
};

const formatDateTime = (value: string | null) => {
  if (!value) return 'Chưa sử dụng';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const MicrosoftIntegrationCard = () => {
  const { selectedCompany } = useCompany();
  const { user } = useAuthContext();
  const [state, setState] = useState<MicrosoftConnectionState>(emptyState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const configured = sharePointService.isConfigured();

  const refresh = async () => {
    if (!configured || !selectedCompany?.id || !user?.id) {
      setState(emptyState);
      return;
    }
    setState(await sharePointService.getConnection(selectedCompany.id, user.id));
  };

  useEffect(() => {
    refresh().catch(() => setState(emptyState));
  }, [configured, selectedCompany?.id, user?.id]);

  const connect = async () => {
    if (!selectedCompany?.id || !user?.id) return;
    setBusy(true);
    setError('');
    try {
      await sharePointService.connect(selectedCompany.id, user.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể kết nối Microsoft.');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!selectedCompany?.id || !user?.id) return;
    if (!window.confirm('Ngắt kết nối Microsoft của bạn khỏi công ty đang chọn?')) return;
    setBusy(true);
    setError('');
    try {
      await sharePointService.disconnect(selectedCompany.id, user.id);
      setState(emptyState);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể ngắt kết nối Microsoft.');
    } finally {
      setBusy(false);
    }
  };

  const connected = state.status === 'connected' && state.connection;
  const needsReconnect = state.status === 'reconnect_required' && state.connection;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" aria-labelledby="microsoft-integration-title">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="microsoft-integration-title" className="text-lg font-semibold text-slate-900">Microsoft 365 & SharePoint</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Kết nối tài khoản Microsoft của bạn để nhập và xuất file. Kết nối này không thay đổi tài khoản đăng nhập hoặc quyền của bạn trong HR.
              </p>
            </div>
          </div>

          {connected ? (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối
            </span>
          ) : needsReconnect ? (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Cần kết nối lại
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Chưa kết nối
            </span>
          )}
        </div>

        {!selectedCompany ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Hãy chọn công ty trước khi kết nối Microsoft.
          </div>
        ) : !configured ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Chưa sẵn sàng</div>
            <p className="mt-1">Quản trị hệ thống cần cấu hình Microsoft cho môi trường này. Người dùng không cần cung cấp mật khẩu Microsoft cho ứng dụng.</p>
          </div>
        ) : connected || needsReconnect ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs font-medium text-slate-500">Tài khoản Microsoft</div>
                <div className="font-semibold text-slate-900 mt-1 break-words">{state.connection?.displayName}</div>
                <div className="text-sm text-slate-500 break-all">{state.connection?.username}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Phạm vi sử dụng</div>
                <div className="font-semibold text-slate-900 mt-1">{selectedCompany.name}</div>
                <div className="text-sm text-slate-500">Chỉ tài khoản của bạn</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Sử dụng gần nhất</div>
                <div className="font-semibold text-slate-900 mt-1">{formatDateTime(state.connection?.lastUsedAt ?? null)}</div>
                <div className="text-sm text-slate-500">Quyền đọc file được chia sẻ</div>
              </div>
            </div>
            {needsReconnect && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Phiên Microsoft không còn trong trình duyệt. Kết nối lại để tiếp tục nhập hoặc xuất dữ liệu.
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Bạn kiểm soát kết nối của mình</div>
                <p className="text-sm text-slate-500 mt-1">Ứng dụng chỉ yêu cầu đọc file mà tài khoản Microsoft của bạn đã có quyền truy cập. Bạn có thể ngắt kết nối bất cứ lúc nào.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">Thông tin đăng nhập Microsoft không được dùng để cấp quyền HR.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {(connected || needsReconnect) && (
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <Unplug className="w-4 h-4" /> Ngắt kết nối
            </button>
          )}
          <button
            type="button"
            onClick={connect}
            disabled={busy || !configured || !selectedCompany || !user}
            className="min-h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {connected ? <RefreshCw className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {busy ? 'Đang xử lý...' : connected || needsReconnect ? 'Kết nối lại / đổi tài khoản' : 'Kết nối Microsoft'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MicrosoftIntegrationCard;

import {
  AccountInfo,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';
import {
  MICROSOFT_CONNECTION_SCOPES,
  markMicrosoftConnectionUsed,
  readMicrosoftConnection,
  removeMicrosoftConnection,
  saveMicrosoftConnection,
  type MicrosoftConnectionRecord,
} from './microsoftConnectionStore';

const GRAPH_SCOPES = [...MICROSOFT_CONNECTION_SCOPES];
let msalClient: PublicClientApplication | null = null;
let msalInitialization: Promise<void> | null = null;

const getConfig = () => {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error(
      'Kết nối SharePoint chưa được cấu hình. Quản trị hệ thống cần thêm Microsoft Client ID.',
    );
  }

  return { clientId };
};

const getClient = async () => {
  if (!msalClient) {
    const { clientId } = getConfig();
    msalClient = new PublicClientApplication({
      auth: {
        clientId,
        // AppForYou owns one multitenant registration. Microsoft resolves the
        // signed-in user's home organization; customers never configure IDs.
        authority: 'https://login.microsoftonline.com/organizations',
        redirectUri: `${window.location.origin}/redirect.html`,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'sessionStorage',
      },
    });
    msalInitialization = msalClient.initialize();
  }

  await msalInitialization;
  return msalClient;
};

const encodeSharingUrl = (sharingUrl: string) => {
  const bytes = new TextEncoder().encode(sharingUrl);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `u!${btoa(binary).replace(/=+$/g, '').replace(/\//g, '_').replace(/\+/g, '-')}`;
};

const acquireToken = async (account: AccountInfo) => {
  const client = await getClient();
  try {
    const result = await client.acquireTokenSilent({ account, scopes: GRAPH_SCOPES });
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const result = await client.acquireTokenPopup({ account, scopes: GRAPH_SCOPES });
      return result.accessToken;
    }
    throw error;
  }
};

export interface SharePointFile {
  name: string;
  content: ArrayBuffer;
}

export interface MicrosoftConnectionState {
  connection: MicrosoftConnectionRecord | null;
  status: 'connected' | 'reconnect_required' | 'disconnected';
}

const getConnectionState = async (
  companyId: string,
  userId: string,
): Promise<MicrosoftConnectionState> => {
  const connection = readMicrosoftConnection(window.sessionStorage, companyId, userId);
  if (!connection) return { connection: null, status: 'disconnected' };

  const client = await getClient();
  const account = client
    .getAllAccounts()
    .find((candidate) => candidate.homeAccountId === connection.homeAccountId);
  if (!account) return { connection, status: 'reconnect_required' };
  client.setActiveAccount(account);
  return { connection, status: 'connected' };
};

const requireConnectedAccount = async (companyId: string, userId: string) => {
  const state = await getConnectionState(companyId, userId);
  if (state.status !== 'connected' || !state.connection) {
    throw new Error('Kết nối Microsoft đã hết phiên. Hãy kết nối lại để tiếp tục.');
  }
  const client = await getClient();
  const account = client
    .getAllAccounts()
    .find((candidate) => candidate.homeAccountId === state.connection?.homeAccountId);
  if (!account) throw new Error('Kết nối Microsoft đã hết phiên. Hãy kết nối lại để tiếp tục.');
  return account;
};

export const sharePointService = {
  isConfigured() {
    return Boolean(import.meta.env.VITE_MICROSOFT_CLIENT_ID?.trim());
  },

  async getConnection(companyId: string, userId: string) {
    if (!this.isConfigured()) {
      return { connection: null, status: 'disconnected' } as MicrosoftConnectionState;
    }
    return getConnectionState(companyId, userId);
  },

  async connect(companyId: string, userId: string) {
    const client = await getClient();
    const result = await client.loginPopup({ scopes: GRAPH_SCOPES, prompt: 'select_account' });
    client.setActiveAccount(result.account);
    const now = new Date().toISOString();
    const connection: MicrosoftConnectionRecord = {
      schemaVersion: 1,
      companyId,
      userId,
      homeAccountId: result.account.homeAccountId,
      tenantId: result.account.tenantId,
      username: result.account.username,
      displayName: result.account.name || result.account.username,
      scopes: GRAPH_SCOPES,
      connectedAt: now,
      lastUsedAt: null,
    };
    saveMicrosoftConnection(window.sessionStorage, connection);
    return connection;
  },

  async disconnect(companyId: string, userId: string) {
    const connection = readMicrosoftConnection(window.sessionStorage, companyId, userId);
    const client = await getClient();
    const account = connection
      ? client.getAllAccounts().find((candidate) => candidate.homeAccountId === connection.homeAccountId)
      : null;
    if (account) {
      await client.clearCache({ account });
    }
    client.setActiveAccount(null);
    removeMicrosoftConnection(window.sessionStorage, companyId, userId);
  },

  async downloadSharedFile(
    sharingUrl: string,
    companyId: string,
    userId: string,
  ): Promise<SharePointFile> {
    const normalizedUrl = sharingUrl.trim();
    if (!/^https:\/\//i.test(normalizedUrl)) {
      throw new Error('Link SharePoint không hợp lệ. Hãy dán đường dẫn bắt đầu bằng https://.');
    }

    const account = await requireConnectedAccount(companyId, userId);
    const token = await acquireToken(account);
    markMicrosoftConnectionUsed(window.sessionStorage, companyId, userId);
    const shareId = encodeSharingUrl(normalizedUrl);
    const metadataResponse = await fetch(
      `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 403) {
        throw new Error('Tài khoản Microsoft không có quyền đọc file này. Hãy kiểm tra quyền chia sẻ.');
      }
      if (metadataResponse.status === 404) {
        throw new Error('Không tìm thấy file từ link SharePoint đã nhập.');
      }
      throw new Error(`Không thể đọc file SharePoint (mã lỗi ${metadataResponse.status}).`);
    }

    const metadata = (await metadataResponse.json()) as {
      name?: string;
      file?: unknown;
      '@microsoft.graph.downloadUrl'?: string;
    };
    if (!metadata.file) throw new Error('Link này trỏ tới thư mục. Hãy dán link của một file Excel hoặc CSV.');

    const fileName = metadata.name || 'sharepoint-file';
    if (!/\.(xlsx|xls|csv)$/i.test(fileName)) {
      throw new Error('Pilot hiện chỉ hỗ trợ file Excel (.xlsx, .xls) và CSV.');
    }

    const downloadUrl = metadata['@microsoft.graph.downloadUrl'];
    if (!downloadUrl) {
      const contentResponse = await fetch(
        `https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/content`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!contentResponse.ok) throw new Error('Không thể tải nội dung file SharePoint.');
      return { name: fileName, content: await contentResponse.arrayBuffer() };
    }

    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) throw new Error('Không thể tải nội dung file SharePoint.');
    return { name: fileName, content: await downloadResponse.arrayBuffer() };
  },
};

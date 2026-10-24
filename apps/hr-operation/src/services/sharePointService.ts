import {
  AccountInfo,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';

const GRAPH_SCOPES = ['Files.Read'];
let msalClient: PublicClientApplication | null = null;
let msalInitialization: Promise<void> | null = null;

const getConfig = () => {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID?.trim();
  const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID?.trim();

  if (!clientId || !tenantId) {
    throw new Error(
      'Kết nối SharePoint chưa được cấu hình. Quản trị viên cần thêm Microsoft Client ID và Tenant ID.',
    );
  }

  return { clientId, tenantId };
};

const getClient = async () => {
  if (!msalClient) {
    const { clientId, tenantId } = getConfig();
    msalClient = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: window.location.origin,
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

export const sharePointService = {
  isConfigured() {
    return Boolean(
      import.meta.env.VITE_MICROSOFT_CLIENT_ID?.trim() &&
        import.meta.env.VITE_MICROSOFT_TENANT_ID?.trim(),
    );
  },

  async getSignedInAccount() {
    const client = await getClient();
    return client.getActiveAccount() || client.getAllAccounts()[0] || null;
  },

  async signIn() {
    const client = await getClient();
    const result = await client.loginPopup({ scopes: GRAPH_SCOPES, prompt: 'select_account' });
    client.setActiveAccount(result.account);
    return result.account;
  },

  async signOut() {
    const client = await getClient();
    const account = client.getActiveAccount() || client.getAllAccounts()[0];
    if (account) {
      await client.logoutPopup({ account, mainWindowRedirectUri: window.location.origin });
    }
  },

  async downloadSharedFile(sharingUrl: string, account: AccountInfo): Promise<SharePointFile> {
    const normalizedUrl = sharingUrl.trim();
    if (!/^https:\/\//i.test(normalizedUrl)) {
      throw new Error('Link SharePoint không hợp lệ. Hãy dán đường dẫn bắt đầu bằng https://.');
    }

    const token = await acquireToken(account);
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

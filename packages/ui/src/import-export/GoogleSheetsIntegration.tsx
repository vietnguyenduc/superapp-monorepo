import React, { useState, useCallback } from 'react';

export interface GoogleSheetsConfig {
  apiKey: string;
  clientId: string;
  discoveryDoc: string;
  scopes: string;
}

export interface SpreadsheetData {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    title: string;
    sheetId: number;
    data: any[][];
  }>;
}

interface GoogleSheetsIntegrationProps {
  config: GoogleSheetsConfig;
  onDataImport: (data: any[]) => void;
  onError: (error: string) => void;
  className?: string;
}

const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  config,
  onDataImport,
  onError,
  className = "",
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetData[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Initialize Google API
  const initializeGoogleAPI = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load Google API
      await new Promise((resolve, reject) => {
        if (typeof window.gapi !== 'undefined') {
          resolve(window.gapi);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve(window.gapi);
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // Initialize API
      await window.gapi.load('client:auth2', async () => {
        await window.gapi.client.init({
          apiKey: config.apiKey,
          clientId: config.clientId,
          discoveryDocs: [config.discoveryDoc],
          scope: config.scopes
        });

        const authInstance = window.gapi.auth2.getAuthInstance();
        setIsAuthenticated(authInstance.isSignedIn.get());
      });
      
    } catch (error) {
      console.error('Error initializing Google API:', error);
      onError('Không thể kết nối với Google Sheets API');
    } finally {
      setIsLoading(false);
    }
  }, [config, onError]);

  // Sign in to Google
  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsAuthenticated(true);
      await loadSpreadsheets();
    } catch (error) {
      console.error('Error signing in:', error);
      onError('Không thể đăng nhập Google');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Sign out from Google
  const handleSignOut = useCallback(async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setIsAuthenticated(false);
      setSpreadsheets([]);
      setSelectedSpreadsheet('');
      setSelectedSheet('');
    } catch (error) {
      console.error('Error signing out:', error);
      onError('Không thể đăng xuất');
    }
  }, [onError]);

  // Load user's spreadsheets
  const loadSpreadsheets = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await window.gapi.client.drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id,name)',
        orderBy: 'modifiedTime desc'
      });

      const files = response.result.files || [];
      const spreadsheetData: SpreadsheetData[] = [];

      for (const file of files.slice(0, 10)) { // Limit to 10 recent files
        try {
          const sheetResponse = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: file.id
          });

          const sheets = sheetResponse.result.sheets?.map(sheet => ({
            title: sheet.properties?.title || 'Untitled',
            sheetId: sheet.properties?.sheetId || 0,
            data: []
          })) || [];

          spreadsheetData.push({
            spreadsheetId: file.id,
            title: file.name,
            sheets
          });
        } catch (error) {
          console.warn(`Error loading spreadsheet ${file.name}:`, error);
        }
      }

      setSpreadsheets(spreadsheetData);
      
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      onError('Không thể tải danh sách spreadsheet');
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Import data from selected sheet
  const handleImportData = useCallback(async () => {
    if (!selectedSpreadsheet || !selectedSheet) {
      onError('Vui lòng chọn spreadsheet và sheet');
      return;
    }

    try {
      setIsLoading(true);

      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: selectedSpreadsheet,
        range: selectedSheet
      });

      const values = response.result.values || [];
      
      if (values.length === 0) {
        onError('Sheet không có dữ liệu');
        return;
      }

      // Convert to object format
      const headers = values[0];
      const data = values.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      onDataImport(data);
      
    } catch (error) {
      console.error('Error importing data:', error);
      onError('Không thể import dữ liệu từ Google Sheets');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSpreadsheet, selectedSheet, onDataImport, onError]);

  // Export data to new spreadsheet
  const handleExportData = useCallback(async (data: any[], title: string = 'Exported Data') => {
    if (!isAuthenticated) {
      onError('Vui lòng đăng nhập Google trước');
      return;
    }

    try {
      setIsLoading(true);

      // Create new spreadsheet
      const createResponse = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: `${title} - ${new Date().toLocaleDateString('vi-VN')}`
        }
      });

      const spreadsheetId = createResponse.result.spreadsheetId;
      
      if (!spreadsheetId) {
        throw new Error('Không thể tạo spreadsheet mới');
      }

      // Prepare data for export
      const headers = Object.keys(data[0] || {});
      const values = [
        headers,
        ...data.map(row => headers.map(header => row[header] || ''))
      ];

      // Write data to spreadsheet
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        values
      });

      // Open the new spreadsheet
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
      
      alert('Đã xuất dữ liệu thành công!');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      onError('Không thể xuất dữ liệu lên Google Sheets');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, onError]);

  // Initialize on mount
  React.useEffect(() => {
    initializeGoogleAPI();
  }, [initializeGoogleAPI]);

  const selectedSpreadsheetData = spreadsheets.find(s => s.spreadsheetId === selectedSpreadsheet);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Authentication */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="font-medium text-gray-900">Google Sheets</h3>
            <p className="text-sm text-gray-600">
              {isAuthenticated ? 'Đã kết nối' : 'Chưa kết nối'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              Đăng xuất
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Đang kết nối...' : 'Kết nối Google'}
            </button>
          )}
        </div>
      </div>

      {/* Import Section */}
      {isAuthenticated && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Import từ Google Sheets</h4>
          
          {/* Spreadsheet Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Spreadsheet
              </label>
              <select
                value={selectedSpreadsheet}
                onChange={(e) => setSelectedSpreadsheet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">-- Chọn spreadsheet --</option>
                {spreadsheets.map((sheet) => (
                  <option key={sheet.spreadsheetId} value={sheet.spreadsheetId}>
                    {sheet.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Sheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || !selectedSpreadsheet}
              >
                <option value="">-- Chọn sheet --</option>
                {selectedSpreadsheetData?.sheets.map((sheet) => (
                  <option key={sheet.sheetId} value={sheet.title}>
                    {sheet.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImportData}
            disabled={isLoading || !selectedSpreadsheet || !selectedSheet}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang import...' : '📥 Import dữ liệu'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Đang xử lý...</span>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsIntegration;

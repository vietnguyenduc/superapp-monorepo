import { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from "@superapp/shared-utils";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Đã xảy ra lỗi</h2>
            <p className="text-sm text-gray-600">Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại.</p>
            <div className="space-y-3">
              <button onClick={() => window.location.reload()} className="w-full py-2 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Tải lại
              </button>
              <button onClick={() => window.location.href = '/'} className="w-full py-2 px-4 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">
                Về trang chủ
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-gray-100 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-gray-900">Chi tiết lỗi</summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import React from "react";

interface ErrorFallbackProps {
  title: string;
  message: string;
  retry?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title,
  message,
  retry
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;

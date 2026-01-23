import React from "react";
import { useTranslation } from "react-i18next";

interface FallbackUIProps {
  title: string;
  message: string;
  size?: "sm" | "md" | "lg";
}

interface LoadingFallbackProps extends FallbackUIProps {
  size?: "sm" | "md" | "lg";
}

interface ErrorFallbackProps extends FallbackUIProps {
  retry?: () => void;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  title,
  message,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  };

  return (
    <div className={`text-center ${sizeClasses[size]}`}>
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-blue-100 rounded-full">
        <svg
          className="w-6 h-6 text-blue-600 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title,
  message,
  retry,
}) => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {useTranslation().t("common.retry")}
        </button>
      )}
    </div>
  );
};

export const EmptyStateFallback: React.FC<FallbackUIProps> = ({
  title,
  message,
}) => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 rounded-full">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};

import React from "react";

interface LoadingFallbackProps {
  title: string;
  message: string;
  size?: "sm" | "md" | "lg";
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  title,
  message,
  size = "md"
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-6 h-6";
      case "md":
        return "w-8 h-8";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-8 h-8";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className={`${getSizeClasses()} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default LoadingFallback;

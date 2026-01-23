import React from "react";
import appleTheme from "../../styles/theme";

interface AddButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
  showShine?: boolean;
  variant?: "default" | "plain";
}

const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  title = "Thêm",
  className = "",
  showShine = false,
  variant = "default",
}) => {
  const baseClass =
    variant === "plain"
      ? "w-6 h-6 rounded-full flex items-center justify-center text-lg font-bold shadow-sm hover:shadow-md transition-all duration-200 ease-in-out hover:scale-105 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-0"
      : appleTheme.getButtonClass("icon");

  const shineClass = showShine ? "shine-effect" : "";

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${shineClass} ${className}`.trim()}
      title={title}
    >
      <span className="text-lg font-bold leading-none">+</span>
    </button>
  );
};

export default AddButton;

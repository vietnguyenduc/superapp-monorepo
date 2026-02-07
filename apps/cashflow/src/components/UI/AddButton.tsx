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
      ? "w-8 h-8 min-w-[2rem] min-h-[2rem] flex-shrink-0 rounded-full flex items-center justify-center text-base font-bold shadow-sm hover:shadow-md transition-all duration-200 ease-in-out hover:scale-105 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-0"
      : `${appleTheme.getButtonClass("icon")} w-9 h-9 min-w-[2.25rem] min-h-[2.25rem] flex-shrink-0 text-base`;

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

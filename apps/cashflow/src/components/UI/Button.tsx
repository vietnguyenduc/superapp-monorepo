import React from "react";
import appleTheme from "../../styles/theme";

interface ButtonProps {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "icon";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  title?: string;
  showShine?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  title,
  showShine = false,
}) => {
  const baseClass = appleTheme.getButtonClass(variant, size);
  const disabledClass = disabled ? appleTheme.buttons.primary.disabled : "";
  const shineClass = showShine ? "shine-effect" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClass} ${disabledClass} ${shineClass} ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default Button;

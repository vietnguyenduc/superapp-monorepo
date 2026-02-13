import React from "react";
import clsx from "clsx";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 shadow-lg px-6 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;

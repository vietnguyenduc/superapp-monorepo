import type { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const Card = ({ children, className, noPadding }: CardProps) => {
  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-900 rounded-2xl shadow-sm shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-800",
        !noPadding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

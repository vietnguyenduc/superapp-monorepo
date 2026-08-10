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
        "card",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

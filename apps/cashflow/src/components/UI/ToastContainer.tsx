import React, { useEffect, useState } from "react";
import { toastManager, type ToastMessage, type ToastType } from "../../utils/toast";

const typeStyles: Record<ToastType, string> = {
  success:
    "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",
  error:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
  info:
    "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  warning:
    "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800",
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-md border p-3 shadow-lg text-sm ${typeStyles[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};

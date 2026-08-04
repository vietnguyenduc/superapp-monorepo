export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Array<(toasts: ToastMessage[]) => void> = [];

  add(message: string, type: ToastType = "info", duration = 4000): string {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: ToastMessage = { id, type, message, duration };
    this.toasts = [...this.toasts, toast];
    this.notify();
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
    return id;
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  subscribe(listener: (toasts: ToastMessage[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = [...this.toasts];
    this.listeners.forEach((l) => l(current));
  }

  success(message: string, duration?: number): string {
    return this.add(message, "success", duration);
  }

  error(message: string, duration?: number): string {
    return this.add(message, "error", duration);
  }

  info(message: string, duration?: number): string {
    return this.add(message, "info", duration);
  }

  warning(message: string, duration?: number): string {
    return this.add(message, "warning", duration);
  }
}

export const toastManager = new ToastManager();

export const toast = {
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  error: (message: string, duration?: number) => toastManager.error(message, duration),
  info: (message: string, duration?: number) => toastManager.info(message, duration),
  warning: (message: string, duration?: number) => toastManager.warning(message, duration),
  dismiss: (id: string) => toastManager.remove(id),
};

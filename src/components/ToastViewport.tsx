"use client";

import { dismissToast, useToasts } from "../store/useUiStore";
import { Icon } from "./Icon";

export function ToastViewport() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`toast toast--${toast.tone}`} key={toast.id}>
          <span>{toast.message}</span>
          <button type="button" className="icon-button icon-button--small" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)}>
            <Icon name="close" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

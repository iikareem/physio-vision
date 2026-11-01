"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ---------- Spinner / loading / empty / alerts ---------- */

export function Spinner({
  className = "h-5 w-5",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent opacity-80 ${className}`}
      role="status"
      aria-label={label}
    />
  );
}

export function LoadingBlock({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200/70 bg-white/70 px-6 py-10 text-stone-500 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-6 w-6 text-[color:var(--accent)]" label={label} />
      <p className="text-sm font-medium text-stone-600">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center">
      <p className="font-semibold text-stone-800">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AlertBanner({
  tone = "error",
  children,
  onDismiss,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const styles =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${styles}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Toasts ---------- */

type ToastTone = "info" | "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  push: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (message) => push(message, "success"),
      error: (message) => push(message, "error"),
      info: (message) => push(message, "info"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const tone =
    item.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : item.tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-stone-200 bg-white text-stone-800";

  useEffect(() => {
    // ensure animation class applies after mount
  }, []);

  return (
    <div
      className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg animate-[toast-in_220ms_ease-out] ${tone}`}
      role="status"
    >
      <p className="min-w-0 flex-1 font-medium leading-snug">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-xs font-semibold opacity-60 hover:opacity-100"
      >
        Close
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => undefined,
      success: () => undefined,
      error: () => undefined,
      info: () => undefined,
    } satisfies ToastApi;
  }
  return ctx;
}

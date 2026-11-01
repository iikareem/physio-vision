import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-stone-500 sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/70 bg-white/90 shadow-[0_1px_2px_rgba(28,42,36,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Surface className="px-4 py-4 sm:px-5">
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--accent-label)" }}
      >
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-stone-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </Surface>
  );
}

export function PrimaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`btn-accent min-h-11 touch-manipulation rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`btn-secondary min-h-11 touch-manipulation rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "input-accent min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:ring-2";

"use client";

import { useEffect, useState } from "react";
import {
  getIosInstallContext,
  IOS_INSTALL_DISMISS_KEY,
  type IosInstallContext,
} from "@/lib/pwa";

type Props = {
  /** Compact card for login; fuller card for settings. */
  variant?: "banner" | "card";
  className?: string;
};

function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
      />
    </svg>
  );
}

export function IosInstallGuide({ variant = "banner", className = "" }: Props) {
  const [ctx, setCtx] = useState<IosInstallContext | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const next = getIosInstallContext();
    setCtx(next);
    try {
      setDismissed(
        window.localStorage.getItem(IOS_INSTALL_DISMISS_KEY) === "1",
      );
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!ctx) return null;
  if (ctx.isStandalone) return null;
  if (!ctx.needsInstallHelp && !ctx.needsSafari) return null;
  if (variant === "banner" && dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(IOS_INSTALL_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  const oldIOS = ctx.iosMajor !== null && ctx.iosMajor < 13;
  const title = ctx.needsSafari
    ? "Open in Safari to install"
    : "Add Physio Vision to your Home Screen";

  const steps = ctx.needsSafari
    ? [
        "Tap the ··· or share menu in this browser",
        "Choose Open in Safari",
        "In Safari, tap Share → Add to Home Screen",
      ]
    : oldIOS
      ? [
          "Tap Share at the bottom of Safari",
          "Scroll and tap Add to Home Screen",
          "Tap Add — then open the new icon on your Home Screen",
        ]
      : [
          "Tap Share in Safari",
          "Scroll and tap Add to Home Screen",
          "Tap Add — open Physio Vision from your Home Screen next time",
        ];

  const shell =
    variant === "card"
      ? "rounded-2xl border border-teal-200/60 bg-teal-50/90 p-5 text-teal-950"
      : "rounded-2xl border border-white/15 bg-white/10 p-4 text-teal-50";

  return (
    <div className={`${shell} ${className}`} role="region" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`font-[family-name:var(--font-display)] text-base font-semibold tracking-tight ${
              variant === "card" ? "text-teal-950" : "text-white"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-1 text-sm ${
              variant === "card" ? "text-teal-800/80" : "text-teal-100/85"
            }`}
          >
            {ctx.needsSafari
              ? "Older iPhones and iPads install the app best from Safari — not Chrome or other browsers."
              : "Works on older iPhones too. Safari can pin this site like an app on your Home Screen."}
          </p>
        </div>
        {variant === "banner" ? (
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-teal-100/80 hover:bg-white/10 hover:text-white"
          >
            Not now
          </button>
        ) : null}
      </div>

      <ol
        className={`mt-3 space-y-2 text-sm ${
          variant === "card" ? "text-teal-900" : "text-teal-50"
        }`}
      >
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                variant === "card"
                  ? "bg-teal-700 text-white"
                  : "bg-white/20 text-white"
              }`}
            >
              {i + 1}
            </span>
            <span className="inline-flex flex-wrap items-center gap-1.5 leading-snug">
              {i === 0 && !ctx.needsSafari ? (
                <>
                  Tap
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-semibold">
                    <ShareIcon className="h-3.5 w-3.5" />
                    Share
                  </span>
                  {oldIOS ? "at the bottom of Safari" : "in Safari"}
                </>
              ) : (
                step
              )}
            </span>
          </li>
        ))}
      </ol>

      {ctx.iosMajor !== null && ctx.iosMajor < 11 ? (
        <p
          className={`mt-3 text-xs ${
            variant === "card" ? "text-teal-800/70" : "text-teal-100/70"
          }`}
        >
          On very old iOS, the Home Screen icon opens the site in Safari. That
          still works for daily use — just bookmark via Add to Home Screen.
        </p>
      ) : null}
    </div>
  );
}

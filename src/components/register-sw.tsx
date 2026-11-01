"use client";

import { useEffect } from "react";
import { getIosInstallContext } from "@/lib/pwa";

/**
 * Register the service worker when supported.
 * Older iOS (and some in-app browsers) lack SW — the app still works via
 * apple-mobile-web-app-capable + Add to Home Screen without offline caching.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const { isIOS, iosMajor, isStandalone } = getIosInstallContext();
    // Service Worker support on iOS starts at 11.3; skip hopeless versions.
    if (isIOS && iosMajor !== null && iosMajor < 12) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent — install-as-bookmark still works without SW.
      });
    };

    // Defer on iOS home-screen apps so first paint stays snappy.
    if (isStandalone && "requestIdleCallback" in window) {
      (
        window as Window & {
          requestIdleCallback: (cb: () => void) => number;
        }
      ).requestIdleCallback(register);
    } else {
      window.setTimeout(register, isIOS ? 1200 : 0);
    }
  }, []);

  return null;
}

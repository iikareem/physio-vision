"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // Only register in production builds so HMR isn't cached oddly in dev.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}

"use client";

import { useEffect, useState } from "react";

/**
 * False on the server and on the client's first paint; true after mount.
 * Use this (not store `ready` alone) before swapping Loading → content, so
 * streamed routes don't hydrate against a parent that already finished
 * loading localStorage.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

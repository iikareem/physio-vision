"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { WORKSPACES } from "@/data/mock";
import { useAppStore } from "@/context/app-store";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { useHydrated } from "@/lib/use-hydrated";
import { WORKSPACE_CHROME, workspaceTheme } from "@/lib/workspace-theme";

const NAV = [
  {
    href: "/",
    label: "Today",
    match: (path: string) => path === "/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M7 3.75h10A2.25 2.25 0 0 1 19.25 6v12A2.25 2.25 0 0 1 17 20.25H7A2.25 2.25 0 0 1 4.75 18V6A2.25 2.25 0 0 1 7 3.75Zm1.25 4.5h7.5v1.5h-7.5v-1.5Zm0 3.5h7.5v1.5h-7.5v-1.5Zm0 3.5h5v1.5h-5v-1.5Z" />
      </svg>
    ),
  },
  {
    href: "/sessions",
    label: "Sessions",
    match: (path: string) => path.startsWith("/sessions"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M8.25 4.5a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5ZM5.25 9A2.25 2.25 0 0 1 7.5 6.75h9A2.25 2.25 0 0 1 18.75 9v9A2.25 2.25 0 0 1 16.5 20.25h-9A2.25 2.25 0 0 1 5.25 18V9Zm3 2.25v1.5h7.5v-1.5h-7.5Zm0 3.5v1.5h5v-1.5h-5Z" />
      </svg>
    ),
  },
  {
    href: "/patients",
    label: "Patients",
    match: (path: string) => path.startsWith("/patients"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M16 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 16 11Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2.25c-2.5 0-4.75 1.25-4.75 2.75V18h9.5v-2c0-1.5-2.25-2.75-4.75-2.75Zm8 .25c-.3 0-.6.02-.9.06 1.15.7 1.9 1.7 1.9 2.69V18H21.5v-1.5c0-1.35-1.9-2.5-5.5-2.5Z" />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Stats",
    match: (path: string) => path.startsWith("/analytics"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M4.75 19.25h14.5a.75.75 0 0 0 0-1.5H4.75a.75.75 0 0 0 0 1.5ZM7 16.5a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-1.5 0v6A.75.75 0 0 0 7 16.5Zm5 0a.75.75 0 0 0 .75-.75V5.75a.75.75 0 0 0-1.5 0v10a.75.75 0 0 0 .75.75Zm5 0a.75.75 0 0 0 .75-.75v-3.5a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 .75.75Z" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "More",
    match: (path: string) => path.startsWith("/settings"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M12 8.25a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5Zm9 3a.75.75 0 0 0-.4-.66l-.9-.52a7.4 7.4 0 0 0-.2-1l.72-.78a.75.75 0 0 0-.05-1.04l-1.5-1.5a.75.75 0 0 0-1.04-.05l-.78.72a7.4 7.4 0 0 0-1-.2l-.52-.9a.75.75 0 0 0-.66-.4h-2.14a.75.75 0 0 0-.66.4l-.52.9a7.4 7.4 0 0 0-1 .2l-.78-.72a.75.75 0 0 0-1.04.05l-1.5 1.5a.75.75 0 0 0-.05 1.04l.72.78c-.1.32-.16.65-.2 1l-.9.52a.75.75 0 0 0-.4.66v2.14c0 .3.17.55.4.66l.9.52c.04.34.1.67.2 1l-.72.78a.75.75 0 0 0 .05 1.04l1.5 1.5c.28.28.73.3 1.04.05l.78-.72c.33.1.66.16 1 .2l.52.9c.11.23.36.4.66.4h2.14c.3 0 .55-.17.66-.4l.52-.9c.34-.04.67-.1 1-.2l.78.72c.31.25.76.23 1.04-.05l1.5-1.5a.75.75 0 0 0 .05-1.04l-.72-.78c.1-.33.16-.66.2-1l.9-.52c.23-.11.4-.36.4-.66V11.25Z" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const { workspaceId } = useAppStore();
  // Keep SSR + first client paint on the clinic theme so localStorage workspace
  // restore can't cause a hydration mismatch.
  const visualId = hydrated ? workspaceId : "clinic";
  const workspace = WORKSPACES.find((w) => w.id === visualId);
  const theme = workspaceTheme(visualId);
  const chrome = WORKSPACE_CHROME[visualId];

  useEffect(() => {
    document.documentElement.style.backgroundColor = chrome;
    document.body.style.backgroundColor = chrome;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", chrome);
  }, [chrome]);

  return (
    <div
      data-workspace={visualId}
      className={`flex min-h-screen min-h-dvh flex-col md:flex-row ${theme.pageTint}`}
    >
      <aside
        className={`sticky top-0 z-30 hidden h-dvh w-56 shrink-0 flex-col border-r md:flex lg:w-64 ${theme.shell}`}
      >
        <div className="flex flex-col gap-4 px-4 py-5 lg:px-5">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-white">
              Physio Vision
            </p>
            <p className={`mt-0.5 text-xs ${theme.shellMuted}`}>
              {workspace?.description}
            </p>
          </div>
          <WorkspaceSwitcher />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pb-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? theme.navActive : theme.navIdle
                }`}
              >
                {item.icon}
                {item.label === "More"
                  ? "Settings"
                  : item.label === "Stats"
                    ? "Analytics"
                    : item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t px-5 py-4 text-xs ${theme.shellFooter}`}>
          <span
            className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
              visualId === "clinic" ? "bg-teal-400" : "bg-sky-400"
            }`}
            aria-hidden
          />
          {workspace?.name} mode
        </div>
      </aside>

      {/* Solid top bar: fills notch/status area so PWA never shows a black/shadow band. */}
      <div
        className="sticky top-0 z-30 md:hidden"
        style={{ backgroundColor: chrome }}
      >
        <div
          aria-hidden
          className="w-full"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            backgroundColor: chrome,
          }}
        />
        <div
          className={`flex items-center justify-between gap-3 px-4 pb-3 pt-2 ${theme.shell}`}
          style={{ backgroundColor: chrome }}
        >
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white">
              Physio Vision
            </p>
            <p className={`truncate text-xs ${theme.shellMuted}`}>
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                  visualId === "clinic" ? "bg-teal-400" : "bg-sky-400"
                }`}
                aria-hidden
              />
              {workspace?.name} · one patient at a time
            </p>
          </div>
          <WorkspaceSwitcher compact />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-between border-b border-stone-200/80 bg-white/80 px-6 py-3 backdrop-blur md:flex lg:px-8">
          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wider ${theme.headerEyebrow}`}
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                  visualId === "clinic" ? "bg-teal-600" : "bg-sky-600"
                }`}
                aria-hidden
              />
              {workspace?.name} workspace
            </p>
            <p className="text-sm text-stone-500">
              Your day, sessions, and patients — separate for Clinic and Private
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 md:px-6 md:pb-8 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-white/95 backdrop-blur md:hidden safe-bottom"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold ${
                    active ? theme.mobileNavActive : "text-stone-500"
                  }`}
                >
                  <span
                    className={`rounded-full p-1 ${
                      active ? theme.mobileNavActiveBg : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

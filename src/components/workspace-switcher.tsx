"use client";

import { WORKSPACES } from "@/data/mock";
import { useAppStore } from "@/context/app-store";
import { useHydrated } from "@/lib/use-hydrated";
import { WORKSPACE_THEME } from "@/lib/workspace-theme";
import type { WorkspaceId } from "@/lib/types";

const ICONS: Record<WorkspaceId, React.ReactNode> = {
  clinic: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M4.75 7.5A2.75 2.75 0 0 1 7.5 4.75h9A2.75 2.75 0 0 1 19.25 7.5v11a.75.75 0 0 1-.75.75h-13a.75.75 0 0 1-.75-.75v-11Zm3.5 1.25v1.5h2v2h1.5v-2h2v-1.5h-2v-2h-1.5v2h-2ZM6.25 16.5h4v1.5h-4v-1.5Zm5.5 0h6v1.5h-6v-1.5Z" />
    </svg>
  ),
  private: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 3.75a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5ZM5.25 18.5c0-2.9 2.85-4.75 6.75-4.75s6.75 1.85 6.75 4.75v.25a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-.25Z" />
    </svg>
  ),
};

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const { workspaceId, setWorkspaceId } = useAppStore();
  const visualId = hydrated ? workspaceId : "clinic";
  const theme = WORKSPACE_THEME[visualId];
  const selectedIndex = visualId === "clinic" ? 0 : 1;

  return (
    <div
      className={`relative grid grid-cols-2 rounded-2xl p-1 ring-1 ${theme.switcherTrack} ${
        compact ? "min-w-[11.5rem] shrink-0" : "w-full"
      }`}
      role="group"
      aria-label="Workspace"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl shadow-md transition-all duration-300 ease-out ${
          visualId === "clinic"
            ? "bg-teal-300 text-teal-950"
            : "bg-sky-300 text-slate-950"
        }`}
        style={{
          transform: `translateX(calc(${selectedIndex} * (100% + 0.25rem)))`,
        }}
      />

      {WORKSPACES.map((ws) => {
        const id = ws.id as WorkspaceId;
        const active = visualId === id;
        return (
          <button
            key={ws.id}
            type="button"
            aria-pressed={active}
            onClick={() => setWorkspaceId(id)}
            className={`relative z-10 flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold transition-colors duration-200 ${
              active ? "text-stone-950" : theme.chipIdle
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                active ? "bg-black/10" : "bg-white/5"
              }`}
            >
              {ICONS[id]}
            </span>
            <span className={compact ? "text-[13px] leading-none" : "leading-none"}>
              {ws.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

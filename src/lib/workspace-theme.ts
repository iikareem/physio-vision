import type { WorkspaceId } from "@/lib/types";

/** Visual identity for each workspace — used in shell, switcher, and accents. */
export const WORKSPACE_THEME = {
  clinic: {
    id: "clinic" as const,
    label: "Clinic",
    /** Sidebar / mobile header */
    shell: "bg-teal-950 text-teal-50 border-teal-900/20",
    shellMuted: "text-teal-200/70",
    shellFooter: "border-teal-800/50 text-teal-300/60",
    navActive: "bg-teal-800/80 text-white",
    navIdle: "text-teal-100/75 hover:bg-teal-900/60 hover:text-white",
    /** Switcher chip when this workspace is selected */
    chipActive: "bg-teal-300 text-teal-950 shadow-sm",
    chipIdle: "text-teal-100/70 hover:bg-white/5 hover:text-white",
    switcherTrack: "bg-black/35 ring-white/15",
    /** In-content accents */
    headerEyebrow: "text-teal-700/80",
    mobileNavActive: "text-teal-700",
    mobileNavActiveBg: "bg-teal-50",
    hero: "from-teal-800 to-teal-950 text-teal-50",
    heroMuted: "text-teal-200/80",
    heroBody: "text-teal-100/90",
    heroCta: "bg-white text-teal-950 hover:bg-teal-50",
    link: "text-teal-700",
    pageTint:
      "bg-[radial-gradient(ellipse_90%_55%_at_100%_-10%,#d8f3ea_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_-10%_110%,#e7f5f1_0%,transparent_45%),linear-gradient(180deg,#f7faf8_0%,#f0f4f1_100%)]",
  },
  private: {
    id: "private" as const,
    label: "Private",
    shell: "bg-slate-900 text-slate-50 border-slate-800/40",
    shellMuted: "text-sky-200/70",
    shellFooter: "border-slate-700/60 text-slate-400/80",
    navActive: "bg-slate-700/90 text-white",
    navIdle: "text-slate-300/80 hover:bg-slate-800/70 hover:text-white",
    chipActive: "bg-sky-300 text-slate-950 shadow-sm",
    chipIdle: "text-slate-300/70 hover:bg-white/5 hover:text-white",
    switcherTrack: "bg-black/40 ring-white/12",
    headerEyebrow: "text-sky-800/80",
    mobileNavActive: "text-sky-700",
    mobileNavActiveBg: "bg-sky-50",
    hero: "from-slate-800 to-slate-950 text-slate-50",
    heroMuted: "text-sky-200/80",
    heroBody: "text-slate-200/90",
    heroCta: "bg-white text-slate-950 hover:bg-sky-50",
    link: "text-sky-700",
    pageTint:
      "bg-[radial-gradient(ellipse_90%_55%_at_100%_-10%,#dbeafe_0%,transparent_50%),radial-gradient(ellipse_70%_45%_at_-10%_110%,#e2e8f0_0%,transparent_45%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]",
  },
} as const;

export function workspaceTheme(id: WorkspaceId) {
  return WORKSPACE_THEME[id];
}

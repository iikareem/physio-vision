"use client";

import { useRouter } from "next/navigation";
import { WORKSPACES } from "@/data/mock";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/context/app-store";
import { IosInstallGuide } from "@/components/ios-install-guide";
import { PageHeader, SecondaryButton, Surface } from "@/components/ui";

export function SettingsView() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    workspaceId,
    patients,
    todayAppointments,
    workspaceSessions,
    clearCache,
  } = useAppStore();
  const workspace = WORKSPACES.find((w) => w.id === workspaceId);

  function signOut() {
    clearCache();
    logout();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Account and practice workspaces"
      />

      <IosInstallGuide variant="card" />

      <Surface className="space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-stone-800">Account</h2>
          <p className="mt-1 text-stone-800">{user?.name || "Therapist"}</p>
          <p className="mt-0.5 text-sm text-stone-500">{user?.email}</p>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <h2 className="text-sm font-semibold text-stone-800">
            Active workspace
          </h2>
          <p className="mt-1 text-stone-600">
            {workspace?.name} — {workspace?.description}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {patients.length} patients · {todayAppointments.length} today ·{" "}
            {workspaceSessions.length} sessions total
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Switch Clinic / Private from the sidebar. Each workspace keeps its
            own patients and sessions.
          </p>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <h2 className="text-sm font-semibold text-stone-800">Session</h2>
          <p className="mt-1 text-sm text-stone-500">
            Sign out clears this device&apos;s login. Your patient data stays on
            the server.
          </p>
          <SecondaryButton className="mt-3" onClick={signOut}>
            Sign out
          </SecondaryButton>
        </div>
      </Surface>
    </div>
  );
}

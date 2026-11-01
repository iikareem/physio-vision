"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/context/app-store";
import { PatientPicker } from "@/components/patient-picker";
import {
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import { dateOnlyIso, todayDateInputValue } from "@/lib/format";

const SESSION_TYPES = [
  "Follow-up",
  "Assessment",
  "Rehab session",
  "Home visit",
  "Performance",
  "Manual therapy",
];

type Props = {
  lockedPatientId?: string;
  onCancel?: () => void;
  onCreated?: (appointmentId: string) => void;
  openAfterCreate?: boolean;
};

export function AddSessionForm({
  lockedPatientId,
  onCancel,
  onCreated,
  openAfterCreate = true,
}: Props) {
  const router = useRouter();
  const { patients, workspaceSessions, addAppointment, getPatient } =
    useAppStore();

  const activePatients = useMemo(
    () =>
      patients
        .filter((p) => p.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [patients],
  );

  const recentIds = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const s of workspaceSessions) {
      if (seen.has(s.patientId)) continue;
      seen.add(s.patientId);
      ids.push(s.patientId);
      if (ids.length >= 6) break;
    }
    return ids;
  }, [workspaceSessions]);

  const [patientId, setPatientId] = useState(lockedPatientId ?? "");
  const [date, setDate] = useState(todayDateInputValue);
  const [type, setType] = useState("Follow-up");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lockedPatient = lockedPatientId
    ? getPatient(lockedPatientId)
    : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const pid = lockedPatientId || patientId;
    if (!pid || !date || saving) return;
    setError(null);
    setSaving(true);
    try {
      const created = await addAppointment({
        patientId: pid,
        startsAt: dateOnlyIso(date),
        type: type.trim() || "Session",
      });

      onCreated?.(created.id);
      if (openAfterCreate) {
        router.push(`/sessions/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Surface className="p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
            New session
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Pick the patient and date, then save.
          </p>
        </div>

        {lockedPatient ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Patient
            </p>
            <p className="mt-0.5 font-semibold text-stone-900">
              {lockedPatient.name}
            </p>
            <p className="text-sm text-stone-500">
              {lockedPatient.condition ||
                lockedPatient.diagnosis ||
                "No condition"}
            </p>
          </div>
        ) : (
          <Field label="Patient">
            <PatientPicker
              patients={activePatients}
              value={patientId}
              onChange={setPatientId}
              recentIds={recentIds}
            />
          </Field>
        )}

        <Field label="Date">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-600">
            Session type
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`min-h-9 rounded-full px-3 text-sm font-bold ${
                  type === t
                    ? "btn-accent"
                    : "border-2 border-stone-300 bg-white text-stone-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Or type a custom type…"
            className={inputClass}
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onCancel ? (
            <SecondaryButton type="button" onClick={onCancel}>
              Cancel
            </SecondaryButton>
          ) : null}
          <PrimaryButton
            type="submit"
            disabled={!(lockedPatientId || patientId) || saving}
            className="sm:min-w-[10rem]"
          >
            {saving ? "Saving…" : "Save & open"}
          </PrimaryButton>
        </div>
      </form>
    </Surface>
  );
}

"use client";

import { FormEvent, useId, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { PatientStatusPicker } from "@/components/patient-status-picker";
import {
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import type { PatientStatus } from "@/lib/types";

const CONDITION_PRESETS = [
  "Lower back pain",
  "Neck strain",
  "Frozen shoulder",
  "Post-ACL rehab",
  "Chronic knee pain",
  "Plantar fasciitis",
  "Hip mobility",
  "Sports performance",
  "Prenatal physio",
];

type Props = {
  onCancel?: () => void;
  onCreated?: (patientId: string) => void;
};

export function AddPatientForm({ onCancel, onCreated }: Props) {
  const formId = useId();
  const { addPatient } = useAppStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState<PatientStatus>("active");
  const [referredBy, setReferredBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = Boolean(name.trim() && condition.trim());

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setError(null);
    setSaving(true);
    try {
      const created = await addPatient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        condition: condition.trim(),
        status,
        referredBy:
          status === "transferred"
            ? referredBy.trim() || undefined
            : undefined,
      });

      setName("");
      setPhone("");
      setCondition("");
      setStatus("active");
      setReferredBy("");
      onCreated?.(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save patient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Surface className="overflow-hidden">
      <div
        className="border-b border-stone-100 px-5 py-4"
        style={{ background: "color-mix(in srgb, var(--accent-soft) 55%, white)" }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-stone-900">
          New patient
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Add them to this workspace directory. You can book sessions afterward.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              id={`${formId}-name`}
              required
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sara Hassan"
              className={inputClass}
            />
          </Field>

          <Field label="Phone (optional)">
            <input
              id={`${formId}-phone`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="Mobile or clinic contact"
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-600">
            Condition / type
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {CONDITION_PRESETS.map((preset) => {
              const selected = condition === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCondition(preset)}
                  className={`min-h-9 touch-manipulation rounded-full px-3 text-sm font-bold transition ${
                    selected
                      ? "btn-accent"
                      : "border-2 border-stone-300 bg-white text-stone-800 hover:border-stone-400"
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <input
            id={`${formId}-condition`}
            required
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Or type a custom condition…"
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-600">Status</p>
          <PatientStatusPicker value={status} onChange={setStatus} />
          {status === "transferred" ? (
            <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/80 p-3.5">
              <Field label="Referring doctor — optional">
                <input
                  id={`${formId}-referred-by`}
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="Leave blank if unknown"
                  className={inputClass}
                />
              </Field>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
          {onCancel ? (
            <SecondaryButton type="button" onClick={onCancel}>
              Cancel
            </SecondaryButton>
          ) : null}
          <PrimaryButton
            type="submit"
            disabled={!canSave || saving}
            className="sm:min-w-[10rem]"
          >
            {saving ? "Saving…" : "Save patient"}
          </PrimaryButton>
        </div>
      </form>
    </Surface>
  );
}

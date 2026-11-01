"use client";

import { FormEvent, useId, useState } from "react";
import { useAppStore } from "@/context/app-store";
import { PatientStatusPicker } from "@/components/patient-status-picker";
import { PresetOrCustomField } from "@/components/preset-or-custom-field";
import {
  Field,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  Surface,
} from "@/components/ui";
import {
  CONDITION_OPTIONS,
  PRECAUTION_OPTIONS,
  TREATMENT_GOAL_OPTIONS,
} from "@/lib/patient-clinical-options";
import type { PatientStatus } from "@/lib/types";

const textareaClass = `${inputClass} min-h-[5.5rem] py-3`;

type Props = {
  onCancel?: () => void;
  onCreated?: (patientId: string) => void;
};

export function AddPatientForm({ onCancel, onCreated }: Props) {
  const formId = useId();
  const { addPatient } = useAppStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [occupation, setOccupation] = useState("");
  const [condition, setCondition] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [ptEvaluation, setPtEvaluation] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [precautions, setPrecautions] = useState("");
  const [treatmentGoals, setTreatmentGoals] = useState("");
  const [status, setStatus] = useState<PatientStatus>("active");
  const [referredBy, setReferredBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = Boolean(name.trim());

  function resetForm() {
    setName("");
    setPhone("");
    setDateOfBirth("");
    setOccupation("");
    setCondition("");
    setDiagnosis("");
    setPtEvaluation("");
    setMedicalHistory("");
    setPrecautions("");
    setTreatmentGoals("");
    setStatus("active");
    setReferredBy("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave || saving) return;
    setError(null);
    setSaving(true);
    try {
      const created = await addPatient({
        name: name.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        occupation: occupation.trim() || undefined,
        condition: condition.trim(),
        diagnosis: diagnosis.trim() || undefined,
        ptEvaluation: ptEvaluation.trim() || undefined,
        medicalHistory: medicalHistory.trim() || undefined,
        precautions: precautions.trim() || undefined,
        treatmentGoals: treatmentGoals.trim() || undefined,
        status,
        referredBy:
          status === "transferred"
            ? referredBy.trim() || undefined
            : undefined,
      });

      resetForm();
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
          Name is required. Clinical fields are optional — pick a common type or
          write your own wording.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 p-5">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Contact
          </h3>
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

            <Field label="Date of birth (optional)">
              <input
                id={`${formId}-dob`}
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Occupation (optional)">
              <input
                id={`${formId}-occupation`}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Teacher, athlete"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Physio notes
          </h3>
          <p className="text-sm text-stone-500">
            Tap a chip to fill the field, or type your own wording underneath.
          </p>

          <PresetOrCustomField
            id={`${formId}-condition`}
            label="Condition"
            hint="Optional — body area or presenting issue (shows on the board)"
            value={condition}
            onChange={setCondition}
            options={CONDITION_OPTIONS}
            placeholder="e.g. Left knee after fall…"
          />

          <div
            className="rounded-2xl border border-[color:var(--accent)]/25 bg-[color:var(--accent-soft)]/40 p-4"
          >
            <Field label="Diagnosis (optional)">
              <input
                id={`${formId}-diagnosis`}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Type the diagnosis…"
                className={`${inputClass} bg-white`}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
            <Field label="PT evaluation (optional)">
              <textarea
                id={`${formId}-pt-eval`}
                value={ptEvaluation}
                onChange={(e) => setPtEvaluation(e.target.value)}
                rows={4}
                placeholder="ROM, strength, special tests, functional findings…"
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
            <Field label="Relevant history (optional)">
              <textarea
                id={`${formId}-history`}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows={3}
                placeholder="Past injuries, surgeries, meds — whatever matters for treatment…"
                className={textareaClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PresetOrCustomField
              id={`${formId}-precautions`}
              label="Precautions"
              hint="Optional"
              value={precautions}
              onChange={setPrecautions}
              options={PRECAUTION_OPTIONS}
              placeholder="Anything to watch or avoid…"
              multiline
            />
            <PresetOrCustomField
              id={`${formId}-goals`}
              label="Treatment goals"
              hint="Optional"
              value={treatmentGoals}
              onChange={setTreatmentGoals}
              options={TREATMENT_GOAL_OPTIONS}
              placeholder="What you and the patient are working toward…"
              multiline
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Status
          </h3>
          <PatientStatusPicker value={status} onChange={setStatus} />
          {status === "transferred" ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3.5">
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
        </section>

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

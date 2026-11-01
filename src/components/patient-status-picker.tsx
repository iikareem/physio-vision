"use client";

import {
  PATIENT_STATUS_OPTIONS,
  patientStatusSelectedClass,
} from "@/lib/patient-status";
import type { PatientStatus } from "@/lib/types";

export function PatientStatusPicker({
  value,
  onChange,
}: {
  value: PatientStatus;
  onChange: (status: PatientStatus) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1.5"
      role="radiogroup"
      aria-label="Patient status"
    >
      {PATIENT_STATUS_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`min-h-12 touch-manipulation rounded-lg px-3 py-2 text-left transition ${
              selected
                ? patientStatusSelectedClass(option.value)
                : "bg-transparent text-stone-600 hover:bg-white/80"
            }`}
          >
            <span
              className={`block text-sm font-bold ${
                selected ? "" : "text-stone-700"
              }`}
            >
              {option.label}
            </span>
            <span
              className={`block text-xs ${
                selected ? "opacity-80" : "text-stone-500"
              }`}
            >
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

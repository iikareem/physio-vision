"use client";

import { useId } from "react";
import { inputClass } from "@/components/ui";

type Props = {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

function Chip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-9 touch-manipulation rounded-full px-3 text-left text-sm font-semibold transition ${
        selected
          ? "btn-accent shadow-sm"
          : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Physio-friendly field: tap a common type, or type anything.
 * Stored value is always free text — chips only help fill it in.
 */
export function PresetOrCustomField({
  id: idProp,
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = "Or type your own…",
  multiline = false,
  rows = 3,
}: Props) {
  const autoId = useId();
  const fieldId = idProp ?? autoId;
  const isCustom = Boolean(value) && !options.includes(value);

  function toggle(option: string) {
    onChange(value === option ? "" : option);
  }

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <label
            htmlFor={fieldId}
            className="block text-sm font-semibold text-stone-800"
          >
            {label}
          </label>
          {hint ? (
            <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
          ) : null}
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-stone-500 hover:text-stone-800"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onSelect={() => toggle(option)}
          />
        ))}
      </div>

      <div className="mt-3">
        {multiline ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={`${inputClass} min-h-[5rem] bg-white py-3`}
          />
        ) : (
          <input
            id={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${inputClass} bg-white`}
          />
        )}
        {isCustom ? (
          <p className="mt-1.5 text-xs font-medium text-[color:var(--accent-label)]">
            Custom wording — saved as you typed it
          </p>
        ) : null}
      </div>
    </div>
  );
}

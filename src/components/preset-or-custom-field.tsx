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

/**
 * Physio-friendly field: pick from a dropdown, or type a custom value.
 * Stored value is always free text — the list only helps fill it in.
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
  const selectId = `${fieldId}-select`;
  const matched = options.includes(value);
  const selectValue = matched ? value : "";
  const isCustom = Boolean(value) && !matched;

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <label
            htmlFor={selectId}
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

      <select
        id={selectId}
        aria-label={`${label} list`}
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} bg-white`}
      >
        <option value="">
          {isCustom ? "Custom (edit below)" : "Choose from list…"}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

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

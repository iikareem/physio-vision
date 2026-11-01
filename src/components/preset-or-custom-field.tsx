"use client";

import { Field, inputClass } from "@/components/ui";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  /** Use a textarea instead of a single-line input. */
  multiline?: boolean;
  rows?: number;
};

/**
 * Physio-friendly field: pick a common type from a list, or type anything.
 * Stored value is always free text — the dropdown only helps fill it in.
 */
export function PresetOrCustomField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Or type your own…",
  multiline = false,
  rows = 3,
}: Props) {
  const matched = options.includes(value);
  const selectValue = matched ? value : "";

  return (
    <div className="space-y-2">
      <Field label={label}>
        <select
          aria-label={`${label} quick pick`}
          value={selectValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">
            {value && !matched ? "Custom (edit below)" : "Quick pick a type…"}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`${inputClass} min-h-[5rem] py-3`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

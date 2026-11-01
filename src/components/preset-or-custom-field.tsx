"use client";

import { useId } from "react";
import { inputClass } from "@/components/ui";
import type { DiagnosisGroup } from "@/lib/patient-clinical-options";

type BaseProps = {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** Soft highlight for the primary clinical field (e.g. diagnosis). */
  featured?: boolean;
};

type FlatProps = BaseProps & {
  options: readonly string[];
  groups?: never;
};

type GroupedProps = BaseProps & {
  options?: never;
  groups: readonly DiagnosisGroup[];
};

type Props = FlatProps | GroupedProps;

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
export function PresetOrCustomField(props: Props) {
  const {
    id: idProp,
    label,
    hint,
    value,
    onChange,
    placeholder = "Or type your own…",
    multiline = false,
    rows = 3,
    featured = false,
  } = props;
  const autoId = useId();
  const fieldId = idProp ?? autoId;
  const isCustom = Boolean(value) && !(
    ("groups" in props && props.groups
      ? props.groups.some((g) => g.options.includes(value))
      : props.options.includes(value))
  );

  function toggle(option: string) {
    onChange(value === option ? "" : option);
  }

  const shell = featured
    ? "rounded-2xl border border-[color:var(--accent)]/25 bg-[color:var(--accent-soft)]/40 p-4"
    : "rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4";

  return (
    <div className={shell}>
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

      {"groups" in props && props.groups ? (
        <div className="space-y-3">
          {props.groups.map((group) => (
            <div key={group.region}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                {group.region}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={value === option}
                    onSelect={() => toggle(option)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {props.options.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={value === option}
              onSelect={() => toggle(option)}
            />
          ))}
        </div>
      )}

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

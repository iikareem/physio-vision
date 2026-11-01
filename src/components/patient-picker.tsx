"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Patient } from "@/lib/types";
import { inputClass } from "@/components/ui";

type Props = {
  patients: Patient[];
  value: string;
  onChange: (patientId: string) => void;
  /** Highlight these ids at the top when search is empty (e.g. recent). */
  recentIds?: string[];
  placeholder?: string;
  disabled?: boolean;
};

export function PatientPicker({
  patients,
  value,
  onChange,
  recentIds = [],
  placeholder = "Search patient by name or condition…",
  disabled,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = patients.find((p) => p.id === value);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = patients;

    if (q) {
      list = patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.phone?.includes(q) ?? false) ||
          p.condition.toLowerCase().includes(q),
      );
    } else if (recentIds.length > 0) {
      const recent = recentIds
        .map((id) => patients.find((p) => p.id === id))
        .filter((p): p is Patient => Boolean(p));
      const rest = patients.filter((p) => !recentIds.includes(p.id));
      list = [...recent, ...rest];
    }

    return list.slice(0, 40);
  }, [patients, search, recentIds]);

  useEffect(() => {
    setHighlight(0);
  }, [search, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(patient: Patient) {
    onChange(patient.id);
    setSearch("");
    setOpen(false);
  }

  function clear() {
    onChange("");
    setSearch("");
    setOpen(true);
  }

  return (
    <div ref={rootRef} className="relative">
      {selected && !open ? (
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-stone-900">
              {selected.name}
            </p>
            <p className="truncate text-xs text-stone-500">
              {selected.condition}
              {selected.phone ? ` · ${selected.phone}` : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={clear}
            className="btn-secondary shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-bold"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={search}
          autoComplete="off"
          placeholder={placeholder}
          className={inputClass}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
              setOpen(true);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const pickItem = results[highlight];
              if (pickItem) pick(pickItem);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      )}

      {open && !selected && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-stone-500">
              No patients match. Try another name or add them under Patients.
            </li>
          ) : (
            <>
              {!search.trim() && recentIds.length > 0 && (
                <li className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Recent &amp; all
                </li>
              )}
              {results.map((p, index) => {
                const isRecent =
                  !search.trim() && recentIds.includes(p.id) && index < recentIds.length;
                return (
                  <li key={p.id} role="option" aria-selected={index === highlight}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => pick(p)}
                      className={`flex w-full flex-col items-start px-3 py-2.5 text-left ${
                        index === highlight ? "bg-teal-50" : "hover:bg-stone-50"
                      }`}
                    >
                      <span className="font-semibold text-stone-900">
                        {p.name}
                        {isRecent ? (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                            recent
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-stone-500">
                        {p.condition}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
              {patients.length > results.length && search.trim() === "" ? (
                <li className="border-t border-stone-100 px-3 py-2 text-xs text-stone-400">
                  Showing {results.length} of {patients.length} — type to narrow
                </li>
              ) : null}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

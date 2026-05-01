import { useEffect, useId, useRef, useState } from "react";

export type TuiComboboxOption =
  | { kind: "group"; label: string }
  | { kind: "option"; label: string; value: number };

export function TuiCombobox({ name, value, options, onChange, disabled, ariaLabel }: {
  name: string;
  value: number | null;
  options: TuiComboboxOption[];
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [highlightedValue, setHighlightedValue] = useState<number | null>(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const flatOptions = options.filter((o): o is Extract<TuiComboboxOption, { kind: "option" }> => o.kind === "option");
  const current = flatOptions.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  useEffect(() => {
    if (!open || highlightedValue == null) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-value="${highlightedValue}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlightedValue]);

  function openDropdown() {
    setHighlightedValue(value ?? flatOptions[0]?.value ?? null);
    setOpen(true);
  }

  function moveHighlight(delta: number) {
    if (flatOptions.length === 0) return;
    const idx = flatOptions.findIndex(o => o.value === highlightedValue);
    const nextIdx = idx < 0
      ? (delta > 0 ? 0 : flatOptions.length - 1)
      : (idx + delta + flatOptions.length) % flatOptions.length;
    setHighlightedValue(flatOptions[nextIdx]!.value);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        openDropdown();
      }
      return;
    }

    // Open: trap navigation keys so global shortcuts don't fire
    if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); e.stopPropagation(); moveHighlight(1); return; }
    if (e.key === "ArrowUp"   || e.key === "k") { e.preventDefault(); e.stopPropagation(); moveHighlight(-1); return; }
    if (e.key === "Home")    { e.preventDefault(); e.stopPropagation(); setHighlightedValue(flatOptions[0]?.value ?? null); return; }
    if (e.key === "End")     { e.preventDefault(); e.stopPropagation(); setHighlightedValue(flatOptions[flatOptions.length - 1]?.value ?? null); return; }
    if (e.key === "Enter")   {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedValue != null) onChange(highlightedValue);
      setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === "Tab") {
      // Let tab move focus naturally, but close the list first
      setOpen(false);
      return;
    }
  }

  return (
    <div className="tui-combobox" ref={rootRef} data-open={open ? "true" : undefined}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className="tui-combobox-trigger"
        onClick={() => {
          if (disabled) return;
          if (open) setOpen(false); else openDropdown();
        }}
        onKeyDown={onKeyDown}
      >
        <span className="tui-edit-bracket">[</span>
        <span className="tui-combobox-arrow">{open ? "▲" : "▼"}</span>
        <span className="tui-combobox-value">{current?.label ?? "—"}</span>
        <span className="tui-edit-bracket">]</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="tui-combobox-list"
          ref={listRef}
        >
          {options.map((opt, i) => {
            if (opt.kind === "group") {
              return (
                <li key={`g-${i}`} className="tui-combobox-group">── {opt.label} ──</li>
              );
            }
            const sel = opt.value === value;
            const hi = opt.value === highlightedValue;
            return (
              <li
                key={`o-${opt.value}`}
                role="option"
                aria-selected={sel}
                data-value={opt.value}
                data-highlighted={hi ? "true" : undefined}
                data-selected={sel ? "true" : undefined}
                className="tui-combobox-option"
                onMouseEnter={() => setHighlightedValue(opt.value)}
                onMouseDown={(e) => {
                  // mousedown so focus blur doesn't close before selection
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="tui-combobox-arrow-cell">{sel ? "▶" : " "}</span>
                <span>{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}

      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

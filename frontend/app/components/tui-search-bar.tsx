import { useEffect, useRef } from "react";

export function TuiSearchBar({ value, onChange, onClose }: {
  value: string;
  onChange: (v: string) => void;
  onClose: (clear: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <div className="cs-search-bar">
      <span className="cs-search-prompt">/</span>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose(true);
          } else if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            onClose(false);
          }
        }}
        placeholder="filter items… (Esc to clear, Enter to keep)"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="cs-search-input"
      />
    </div>
  );
}

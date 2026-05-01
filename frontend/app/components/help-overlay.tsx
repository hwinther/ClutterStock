import { useEffect } from "react";

const SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: "Move",
    rows: [
      ["j / ↓",      "next item"],
      ["k / ↑",      "previous item"],
      ["g g",        "first item"],
      ["G",          "last item"],
    ],
  },
  {
    title: "Items",
    rows: [
      ["Enter",      "open / view"],
      ["e",          "edit"],
      ["d",          "delete"],
      ["o",          "new item"],
    ],
  },
  {
    title: "Search",
    rows: [
      ["/",          "filter items"],
      ["Esc",        "close panel / clear filter"],
    ],
  },
  {
    title: "Panes",
    rows: [
      ["Alt+1",      "focus rooms sidebar"],
      ["Alt+2",      "focus items list"],
      ["Alt+3",      "focus detail / editor"],
      ["Tab",        "next focusable"],
    ],
  },
  {
    title: "Terminal",
    rows: [
      [":",          "open terminal (vim ex)"],
      ["Alt+4",      "toggle terminal"],
      ["Esc",        "close terminal"],
      ["clear",      "wipe scrollback"],
    ],
  },
  {
    title: "Account",
    rows: [
      ["[user ▌]",   "click chip top-right (TUI)"],
      ["s",          "sign out (in user panel)"],
      ["whoami",     "show profile (terminal)"],
      ["logout",     "sign out (terminal)"],
    ],
  },
  {
    title: "Edit form",
    rows: [
      ["Ctrl+S",     "save"],
      ["Ctrl+Enter", "save"],
      ["Esc",        "cancel"],
    ],
  },
  {
    title: "Other",
    rows: [
      ["?",          "this help"],
    ],
  },
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="cs-help-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cs-help-panel tui-panel">
        <span className="tui-panel-title">─[ keyboard shortcuts ]─</span>
        <div className="cs-help-grid">
          {SECTIONS.map(s => (
            <section key={s.title}>
              <h3 className="cs-help-heading">── {s.title.toLowerCase()} ──</h3>
              <dl>
                {s.rows.map(([k, v]) => (
                  <div key={k} className="cs-help-row">
                    <dt><kbd>{k}</kbd></dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="cs-help-footer">
          <button type="button" onClick={onClose} className="cs-help-close">
            [Esc] close
          </button>
        </div>
      </div>
    </div>
  );
}

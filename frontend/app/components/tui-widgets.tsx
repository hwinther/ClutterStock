export function TuiPanel({ title, as: Tag = "div", children, style }: {
  title?: string;
  as?: "div" | "aside";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Tag className="tui-panel" style={style}>
      {title && <span className="tui-panel-title">{title}</span>}
      {children}
    </Tag>
  );
}

export function TuiStatusBar({ onOpenTerminal }: { onOpenTerminal?: () => void }) {
  const bindings: [string, string][] = [
    ["j k", "move"], ["gg/G", "first/last"], ["e", "edit"], ["d", "del"],
    ["o", "new"], ["/", "filter"], [":", "term"], ["Alt+1/2/3", "panes"], ["?", "help"],
  ];
  return (
    <div className="tui-statusbar">
      {bindings.map(([k, l]) => (
        <span key={k}>
          <span className="tui-statusbar-key">{k}</span>{" "}{l}
        </span>
      ))}
      <button
        type="button"
        onClick={onOpenTerminal}
        className="tui-statusbar-prompt"
        aria-label="Open terminal"
      >
        $ _<span className="tui-cursor">▌</span>
      </button>
    </div>
  );
}

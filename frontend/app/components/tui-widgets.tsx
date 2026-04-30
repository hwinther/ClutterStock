export function TuiPanel({ title, as: Tag = "div", children, style }: {
  title: string;
  as?: "div" | "aside";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Tag className="tui-panel" style={style}>
      <span className="tui-panel-title">{title}</span>
      {children}
    </Tag>
  );
}

export function TuiStatusBar() {
  const bindings: [string, string][] = [
    ["↑↓ / j k", "move"], ["e", "edit"], ["d", "del"],
    ["n", "new"], ["/", "filter"], ["Esc", "close"],
  ];
  return (
    <div className="tui-statusbar">
      {bindings.map(([k, l]) => (
        <span key={k}>
          <span className="tui-statusbar-key">{k}</span>{" "}{l}
        </span>
      ))}
      <span className="tui-statusbar-prompt">
        $ _<span className="tui-cursor">▌</span>
      </span>
    </div>
  );
}

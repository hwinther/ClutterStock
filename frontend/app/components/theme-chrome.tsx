import type { LocationResponse, RoomResponse } from "~/api/client";

export function CDEMenuBar() {
  const menus = ["File", "Selected", "View", "Items", "Help"];
  return (
    <div className="cde-menubar">
      {menus.map(m => (
        <span key={m} className="cde-menubar-item">{m}</span>
      ))}
    </div>
  );
}

export function CDEFootRow({ onNewItem }: { onNewItem: () => void }) {
  const slots: [string, (() => void) | null][] = [
    ["Items", null], ["Rooms", null], ["Stats", null],
    ["Add",   onNewItem],
    ["Print", null], ["Trash", null], ["Help", null],
  ];
  return (
    <div className="cde-footrow">
      {slots.map(([label, action], i) => (
        <button
          key={label}
          className={`cde-footrow-btn${i === 0 ? " cde-footrow-btn--primary" : ""}`}
          onClick={action ?? undefined}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Win98MenuBar() {
  const menus = ["File", "Edit", "View", "Items", "Tools", "Help"];
  return (
    <div className="win98-menubar">
      {menus.map(m => (
        <span key={m} className="win98-menubar-item">
          <u>{m[0]}</u>{m.slice(1)}
        </span>
      ))}
    </div>
  );
}

export function Win98AddressBar({ location, room }: {
  location?: LocationResponse | null;
  room?: RoomResponse | null;
}) {
  const path = room && location
    ? `C:\\ClutterStock\\${location.name}\\${room.name}`
    : location
    ? `C:\\ClutterStock\\${location.name}`
    : `C:\\ClutterStock\\All Items`;
  return (
    <div className="win98-addressbar">
      <span className="win98-addressbar-label">Address</span>
      <div className="win98-addressbar-field">
        <span>📁</span>
        <span>{path}</span>
      </div>
      <button className="win98-addressbar-go">Go</button>
    </div>
  );
}

export function Win98StatusBar({ count, location, room }: {
  count: number;
  location?: LocationResponse | null;
  room?: RoomResponse | null;
}) {
  const path = room && location
    ? `${location.name}\\${room.name}`
    : location?.name ?? "All Items";
  return (
    <div className="win98-statusbar">
      <div className="win98-statusbar-seg">{count} object(s)</div>
      <div className="win98-statusbar-seg">{path}</div>
      <div className="win98-statusbar-seg win98-statusbar-seg--narrow">
        {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

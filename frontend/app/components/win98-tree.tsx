import { useState } from "react";
import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";

export function Win98Tree({
  locations, rooms, items, categories,
  filterRoomId, filterCategory,
  onSelectRoom, onSelectCategory, onAddRoom,
}: {
  locations: LocationResponse[];
  rooms: RoomResponse[];
  items: ItemResponse[];
  categories: string[];
  filterRoomId: number | null;
  filterCategory: string | null;
  onSelectRoom: (id: number) => void;
  onSelectCategory: (name: string) => void;
  onAddRoom: (locationId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [rootCollapsed, setRootCollapsed] = useState(false);
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false);

  const toggle = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="win98-tree">
      <Row
        chevron={rootCollapsed ? "▶" : "▼"}
        icon="▦"
        label="ClutterStock"
        bold
        onChevronClick={() => setRootCollapsed(v => !v)}
      />

      {!rootCollapsed && (
        <div className="win98-tree-indent">
          {locations.map(loc => {
            const locRooms = rooms.filter(r => r.locationId === loc.id);
            const isCollapsed = loc.id != null && collapsed.has(loc.id);
            return (
              <div key={loc.id}>
                <Row
                  chevron={locRooms.length > 0 ? (isCollapsed ? "▶" : "▼") : ""}
                  icon="🏠"
                  label={loc.name ?? "Location"}
                  onChevronClick={() => loc.id != null && toggle(loc.id)}
                  onIconClick={() => loc.id != null && toggle(loc.id)}
                  trailing={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (loc.id != null) onAddRoom(loc.id); }}
                      title="New room"
                      className="win98-tree-add"
                    >＋</button>
                  }
                />
                {!isCollapsed && (
                  <div className="win98-tree-indent">
                    {locRooms.map(room => {
                      const count = items.filter(i => i.roomId === room.id).length;
                      const selected = filterRoomId === room.id;
                      return (
                        <Row
                          key={room.id}
                          icon="📁"
                          label={`${room.name ?? "Room"} (${count})`}
                          selected={selected}
                          onRowClick={() => room.id != null && onSelectRoom(room.id)}
                        />
                      );
                    })}
                    {locRooms.length === 0 && (
                      <div className="win98-tree-empty">No rooms yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {categories.length > 0 && (
        <>
          <div className="win98-tree-divider">
            <button
              type="button"
              onClick={() => setCategoriesCollapsed(v => !v)}
              className="win98-tree-divider-btn"
            >
              {categoriesCollapsed ? "▶" : "▼"} Categories
            </button>
          </div>
          {!categoriesCollapsed && (
            <div className="win98-tree-indent">
              {categories.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                const selected = filterCategory === cat;
                return (
                  <Row
                    key={cat}
                    icon="🏷"
                    label={`${cat} (${count})`}
                    selected={selected}
                    onRowClick={() => onSelectCategory(cat)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}

function Row({
  chevron, icon, label, selected, bold,
  onRowClick, onChevronClick, onIconClick, trailing,
}: {
  chevron?: string;
  icon: string;
  label: string;
  selected?: boolean;
  bold?: boolean;
  onRowClick?: () => void;
  onChevronClick?: () => void;
  onIconClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const interactive = !!onRowClick;
  return (
    <div
      className={`win98-tree-row${selected ? " win98-tree-row--selected" : ""}`}
      onClick={interactive ? onRowClick : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{ cursor: interactive ? "pointer" : "default" }}
    >
      <span
        className="win98-tree-chevron"
        onClick={onChevronClick ? (e) => { e.stopPropagation(); onChevronClick(); } : undefined}
        style={{ cursor: onChevronClick ? "pointer" : "default" }}
      >
        {chevron ?? ""}
      </span>
      <span
        className="win98-tree-icon"
        onClick={onIconClick ? (e) => { e.stopPropagation(); onIconClick(); } : undefined}
      >
        {icon}
      </span>
      <span className="win98-tree-label" style={bold ? { fontWeight: 700 } : undefined}>
        {label}
      </span>
      {trailing && <span className="win98-tree-trailing">{trailing}</span>}
    </div>
  );
}

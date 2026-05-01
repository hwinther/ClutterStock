import type { ItemResponse, RoomResponse } from "~/api/client";

export function TuiItemTable({ items, roomById, selectedId, onSelect, totalCount }: {
  items: ItemResponse[];
  roomById: Record<number, RoomResponse | undefined>;
  selectedId?: number | null;
  onSelect: (item: ItemResponse) => void;
  totalCount: number;
}) {
  return (
    <div className="tui-panel tui-table" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <span className="tui-panel-title">
        {`─[ items · ${items.length}${items.length !== totalCount ? ` of ${totalCount}` : ""} ]─`}
      </span>

      <div className="tui-table-scroll">
        <div className="tui-table-head">
          <span>ID</span>
          <span>NAME</span>
          <span>ROOM</span>
          <span>CAT</span>
          <span>UPD</span>
        </div>

        {items.map(item => {
          const sel = selectedId === item.id;
          const room = item.roomId != null ? roomById[item.roomId] : undefined;
          const updated = formatShortDate(item.updatedAtUtc ?? item.createdAtUtc);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              data-selected={sel ? "true" : undefined}
              onClick={() => onSelect(item)}
              className="tui-table-row"
            >
              <span className="tui-table-id">{String(item.id ?? 0).padStart(3, "0")}</span>
              <span className="tui-table-name">
                <span className="tui-table-arrow">{sel ? "▶ " : "  "}</span>
                {item.name ?? "—"}
              </span>
              <span className="tui-table-dim">{room?.name ?? "—"}</span>
              <span className="tui-table-cat">{item.category ?? "—"}</span>
              <span className="tui-table-dim">{updated}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

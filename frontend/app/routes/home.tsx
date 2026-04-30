import { useState, useEffect, useCallback } from "react";
import { useRevalidator } from "react-router";
import type { Route } from "./+types/home";
import { getLocations, getRooms, getItems, deleteItem } from "~/api/client";
import type { LocationResponse, RoomResponse, ItemResponse } from "~/api/client";
import { CategoryTag } from "~/components/category-tag";
import { ItemThumb } from "~/components/item-thumb";
import { Sparkline } from "~/components/sparkline";
import { TuiPanel, TuiStatusBar } from "~/components/tui-widgets";
import { SidebarGroup, SidebarRow } from "~/components/sidebar";
import { CDEMenuBar, CDEFootRow, Win98MenuBar, Win98AddressBar, Win98StatusBar } from "~/components/theme-chrome";
import { ItemViewPanel } from "~/features/items/item-view-panel";
import { ItemEditPanel } from "~/features/items/item-edit-panel";
import { RoomFormPanel } from "~/features/rooms/room-form-panel";
import { LocationFormPanel } from "~/features/locations/location-form-panel";
import { relativeTime } from "~/lib/time";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const [locations, rooms, items] = await Promise.all([
    getLocations(request),
    getRooms(request),
    getItems(request),
  ]);
  return { locations, rooms, items };
}

export function meta() {
  return [{ title: "ClutterStock" }];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Panel =
  | { mode: "view";         item: ItemResponse }
  | { mode: "edit";         item: ItemResponse }
  | { mode: "new-item";     roomId: number }
  | { mode: "new-room";     locationId?: number }
  | { mode: "new-location" }
  | null;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home({ loaderData }: Route.ComponentProps) {
  const { locations, rooms, items } = loaderData;
  const { revalidate } = useRevalidator();

  const [panel, setPanel]                   = useState<Panel>(null);
  const [filterRoomId, setFilterRoomId]     = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const roomById     = Object.fromEntries(rooms.map(r => [r.id!, r]));
  const locationById = Object.fromEntries(locations.map(l => [l.id!, l]));

  const categories = [...new Set(
    items.map(i => i.category).filter((c): c is string => !!c)
  )].sort();

  const visibleItems = items.filter(item => {
    if (filterRoomId !== null && item.roomId !== filterRoomId) return false;
    if (filterCategory !== null && item.category !== filterCategory) return false;
    return true;
  });

  const activeRoom     = filterRoomId != null ? roomById[filterRoomId] : null;
  const activeLocation = activeRoom?.locationId != null ? locationById[activeRoom.locationId] : null;

  const defaultNewRoomId = filterRoomId ?? rooms[0]?.id ?? undefined;

  const viewItem     = panel?.mode === "view" ? panel.item : null;
  const viewRoom     = viewItem?.roomId != null ? roomById[viewItem.roomId] : null;
  const viewLocation = viewRoom?.locationId != null ? locationById[viewRoom.locationId] : null;

  const openNewItem = useCallback(() => {
    if (rooms.length === 0) {
      setPanel(locations.length === 0 ? { mode: "new-location" } : { mode: "new-room" });
    } else {
      setPanel({ mode: "new-item", roomId: defaultNewRoomId ?? rooms[0]!.id! });
    }
  }, [rooms, locations, defaultNewRoomId]);

  function handleItemSaved(saved: ItemResponse) {
    revalidate();
    setPanel({ mode: "view", item: saved });
  }

  function handleItemDeleted() {
    revalidate();
    setPanel(null);
  }

  function handleLocationCreated(loc: LocationResponse) {
    revalidate();
    setPanel({ mode: "new-room", locationId: loc.id });
  }

  function handleRoomCreated(room: RoomResponse) {
    revalidate();
    setPanel({ mode: "new-item", roomId: room.id! });
  }

  const stats = [
    { label: "Total items", value: items.length },
    { label: "Locations",   value: locations.length },
    { label: "Rooms",       value: rooms.length },
    { label: "Categories",  value: categories.length },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const selectedIdx = panel?.mode === "view"
        ? visibleItems.findIndex(i => i.id === panel.item.id)
        : -1;

      switch (e.key) {
        case "ArrowUp":
        case "k": {
          e.preventDefault();
          if (visibleItems.length === 0) break;
          const prev = visibleItems[selectedIdx <= 0 ? visibleItems.length - 1 : selectedIdx - 1];
          if (prev) setPanel({ mode: "view", item: prev });
          break;
        }
        case "ArrowDown":
        case "j": {
          e.preventDefault();
          if (visibleItems.length === 0) break;
          const next = visibleItems[selectedIdx >= visibleItems.length - 1 ? 0 : selectedIdx + 1];
          if (next) setPanel({ mode: "view", item: next });
          break;
        }
        case "e": {
          if (panel?.mode === "view") setPanel({ mode: "edit", item: panel.item });
          break;
        }
        case "d": {
          if (panel?.mode === "view") {
            const item = panel.item;
            if (confirm(`Delete "${item.name}"?`)) {
              deleteItem(item.id!).then(() => { revalidate(); setPanel(null); });
            }
          }
          break;
        }
        case "n": {
          openNewItem();
          break;
        }
        case "Escape": {
          setPanel(null);
          break;
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, visibleItems, openNewItem, revalidate]);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden", minHeight: 0, background: "var(--c-bg)",
    }}>

      <Win98MenuBar />
      <CDEMenuBar />

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 1, background: "var(--c-border-2)",
        borderBottom: "1px solid var(--c-border)", flexShrink: 0,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "12px 20px", background: "var(--c-bg-2)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{
                fontSize: 11, color: "var(--c-fg-2)",
                textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500,
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 26, fontWeight: 600,
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: "var(--c-fg)",
              }}>
                {s.value}
              </span>
            </div>
            <Sparkline seed={s.value} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", borderBottom: "1px solid var(--c-border)",
        background: "var(--c-bg-2)", flexShrink: 0, gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {activeRoom && (
            <span style={{
              fontSize: 12, padding: "4px 10px",
              border: "1px solid var(--c-border)", background: "var(--c-accent-bg)",
              color: "var(--c-accent)", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ opacity: 0.7 }}>Room</span>
              <span style={{ fontWeight: 500 }}>
                {activeLocation && `${activeLocation.name} / `}{activeRoom.name}
              </span>
              <button
                onClick={() => setFilterRoomId(null)}
                style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
              >×</button>
            </span>
          )}
          {filterCategory && (
            <span style={{
              fontSize: 12, padding: "4px 10px",
              border: "1px solid var(--c-border)", background: "var(--c-accent-bg)",
              color: "var(--c-accent)", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ opacity: 0.7 }}>Category</span>
              <span style={{ fontWeight: 500 }}>{filterCategory}</span>
              <button
                onClick={() => setFilterCategory(null)}
                style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
              >×</button>
            </span>
          )}
          {!activeRoom && !filterCategory && (
            <span style={{ fontSize: 12, color: "var(--c-fg-3)" }}>All items</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--c-fg-2)", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "var(--c-fg-3)" }}>Showing </span>
            <strong style={{ fontWeight: 500, color: "var(--c-fg)" }}>{visibleItems.length}</strong>
            {visibleItems.length !== items.length && (
              <span style={{ color: "var(--c-fg-3)" }}> of {items.length}</span>
            )}
          </span>
          <button onClick={openNewItem} className="btn-primary">+ New item</button>
        </div>
      </div>

      <Win98AddressBar location={activeLocation} room={activeRoom} />

      {/* 3-column body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <TuiPanel as="aside" title="─[ nav ]─" style={{
          width: 200, borderRight: "1px solid var(--c-border)",
          background: "var(--c-bg-2)", padding: "14px 0",
          flexShrink: 0, overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ flex: 1 }}>
            {locations.map(loc => {
              const locRooms = rooms.filter(r => r.locationId === loc.id);
              return (
                <SidebarGroup
                  key={loc.id}
                  title={loc.name ?? "Location"}
                  onAdd={() => setPanel({ mode: "new-room", locationId: loc.id })}
                >
                  {locRooms.map(room => (
                    <SidebarRow
                      key={room.id}
                      label={room.name ?? "Room"}
                      count={items.filter(i => i.roomId === room.id).length}
                      active={filterRoomId === room.id}
                      onClick={() => {
                        setFilterRoomId(filterRoomId === room.id ? null : room.id!);
                        setFilterCategory(null);
                      }}
                    />
                  ))}
                  {locRooms.length === 0 && (
                    <div style={{ padding: "3px 14px 6px", fontSize: 12, color: "var(--c-fg-3)", fontStyle: "italic" }}>
                      No rooms yet
                    </div>
                  )}
                </SidebarGroup>
              );
            })}

            {categories.length > 0 && (
              <SidebarGroup title="Categories">
                {categories.map(cat => (
                  <SidebarRow
                    key={cat}
                    label={cat}
                    count={items.filter(i => i.category === cat).length}
                    active={filterCategory === cat}
                    dot
                    onClick={() => {
                      setFilterCategory(filterCategory === cat ? null : cat);
                      setFilterRoomId(null);
                    }}
                  />
                ))}
              </SidebarGroup>
            )}
          </div>

          {/* New location button at sidebar bottom */}
          <div style={{ borderTop: "1px solid var(--c-border)", padding: "10px 14px" }}>
            <button
              onClick={() => setPanel({ mode: "new-location" })}
              style={{
                width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                background: "transparent", fontFamily: "inherit",
                fontSize: 12, color: "var(--c-fg-3)", padding: "3px 0",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span>
              New location
            </button>
          </div>
        </TuiPanel>

        {/* Table */}
        <TuiPanel title={`─[ items · ${visibleItems.length}${visibleItems.length !== items.length ? ` of ${items.length}` : ""} ]─`} style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "var(--c-bg)" }}>
          {visibleItems.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 8,
              color: "var(--c-fg-3)", fontSize: 13,
            }}>
              <span>No items{filterRoomId || filterCategory ? " matching filters" : ""}.</span>
              <button
                onClick={openNewItem}
                className="link-text"
                style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
              >
                {rooms.length === 0 ? "Set up a location to get started →" : "Add the first item →"}
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--c-bg-2)", position: "sticky", top: 0, zIndex: 1 }}>
                  {["Item", "Room", "Category", "Notes", "Updated"].map((h, i) => (
                    <th key={i} style={{
                      textAlign: "left", padding: "8px 14px",
                      fontSize: 11, fontWeight: 500, color: "var(--c-fg-2)",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      borderBottom: "1px solid var(--c-border)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => {
                  const isSelected = panel?.mode === "view" && panel.item.id === item.id;
                  const room = item.roomId != null ? roomById[item.roomId] : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setPanel(isSelected ? null : { mode: "view", item })}
                      data-selected={isSelected ? "true" : undefined}
                      style={{
                        borderBottom: "1px solid var(--c-border-2)",
                        background: isSelected ? "var(--c-accent-bg-2)" : "transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--c-accent-bg)";
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td style={{
                        padding: "10px 14px",
                        borderLeft: `2px solid ${isSelected ? "var(--c-accent)" : "transparent"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <ItemThumb name={item.name ?? ""} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontWeight: 500 }}>{item.name ?? "Unnamed"}</span>
                            {item.description && (
                              <span style={{ fontSize: 11, color: "var(--c-fg-3)" }}>{item.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-2)" }}>
                        {room?.name ?? "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {item.category
                          ? <CategoryTag name={item.category} />
                          : <span style={{ color: "var(--c-fg-3)" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-3)", fontSize: 12 }}>
                        {item.notes || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-2)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                        {relativeTime(item.updatedAtUtc ?? item.createdAtUtc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TuiPanel>

        {/* Right panel */}
        {panel?.mode === "view" && (
          <ItemViewPanel
            item={panel.item}
            room={viewRoom}
            location={viewLocation}
            onClose={() => setPanel(null)}
            onEdit={() => setPanel({ mode: "edit", item: panel.item })}
            onDelete={() => {
              deleteItem(panel.item.id!).then(() => {
                revalidate();
                setPanel(null);
              });
            }}
          />
        )}
        {(panel?.mode === "edit" || panel?.mode === "new-item") && (
          <ItemEditPanel
            item={panel.mode === "edit" ? panel.item : undefined}
            rooms={rooms}
            locations={locations}
            defaultRoomId={panel.mode === "new-item" ? panel.roomId : undefined}
            onClose={() => setPanel(null)}
            onSaved={handleItemSaved}
            onDeleted={handleItemDeleted}
            onNewRoom={(locationId) => setPanel({ mode: "new-room", locationId })}
          />
        )}
        {panel?.mode === "new-room" && (
          <RoomFormPanel
            locations={locations}
            defaultLocationId={panel.locationId}
            onClose={() => setPanel(null)}
            onCreated={handleRoomCreated}
          />
        )}
        {panel?.mode === "new-location" && (
          <LocationFormPanel
            onClose={() => setPanel(null)}
            onCreated={handleLocationCreated}
          />
        )}
      </div>
      <TuiStatusBar />
      <Win98StatusBar count={visibleItems.length} location={activeLocation} room={activeRoom} />
      <CDEFootRow onNewItem={openNewItem} />
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/home";
import {
  getLocations, getRooms, getItems,
  createItem, updateItem, deleteItem, createRoom, createLocation,
} from "~/api/client";
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
import { TuiItemTable } from "~/features/items/tui-item-table";
import { TuiItemDetail } from "~/features/items/tui-item-detail";
import { TuiItemEdit } from "~/features/items/tui-item-edit";
import { Win98Tree } from "~/components/win98-tree";
import { TuiSearchBar } from "~/components/tui-search-bar";
import { HelpOverlay } from "~/components/help-overlay";
import { TuiTerminal } from "~/components/tui-terminal";
import { relativeTime } from "~/lib/time";
import { useTheme } from "~/lib/theme";
import { getVersionLine } from "~/lib/version";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const [locations, rooms, items] = await Promise.all([
    getLocations(request),
    getRooms(request),
    getItems(request),
  ]);
  return { locations, rooms, items };
}

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  const intent = (fd.get("_intent") as string) ?? "";
  const str = (k: string) => ((fd.get(k) as string) ?? "").trim();
  const opt = (k: string) => str(k) || undefined;
  try {
    if (intent === "create-item") {
      const item = await createItem({ roomId: Number(str("roomId")), name: str("name"), description: opt("description"), category: opt("category"), notes: opt("notes") }, request);
      return { intent, ok: true as const, item };
    }
    if (intent === "update-item") {
      const roomIdStr = str("roomId");
      const roomId = roomIdStr ? Number(roomIdStr) : undefined;
      const item = await updateItem(
        Number(str("itemId")),
        { roomId, name: str("name"), description: opt("description"), category: opt("category"), notes: opt("notes") },
        request,
      );
      return { intent, ok: true as const, item };
    }
    if (intent === "delete-item") {
      await deleteItem(Number(str("itemId")), request);
      return { intent, ok: true as const };
    }
    if (intent === "create-room") {
      const room = await createRoom({ locationId: Number(str("locationId")), name: str("name"), description: opt("description") }, request);
      return { intent, ok: true as const, room };
    }
    if (intent === "create-location") {
      const location = await createLocation({ name: str("name"), description: opt("description") }, request);
      return { intent, ok: true as const, location };
    }
    return { intent, ok: false as const, error: "Unknown intent" };
  } catch (err) {
    if (err instanceof Response) throw err;
    return { intent, ok: false as const, error: "Something went wrong." };
  }
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
  const deleteFetcher = useFetcher<typeof action>();
  const theme = useTheme();
  const isTui = theme === "tui";
  const isWin98 = theme === "win98";

  const [panel, setPanel]                   = useState<Panel>(null);
  const [filterRoomId, setFilterRoomId]     = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]         = useState<string>("");
  const [searchOpen, setSearchOpen]         = useState(false);
  const [helpOpen, setHelpOpen]             = useState(false);
  const [terminalOpen, setTerminalOpen]     = useState(false);

  // Pane refs for Alt+1/2/3 keyboard focus shortcuts
  const navRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  // gg state machine: tracks whether the previous keypress was 'g' (and not stale)
  const pendingGRef = useRef<number | null>(null);

  function onSidebarKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "j" && e.key !== "ArrowUp" && e.key !== "k") return;
    const root = navRef.current;
    if (!root) return;
    e.preventDefault();
    const buttons = Array.from(root.querySelectorAll<HTMLElement>("button:not([disabled])"))
      .filter(b => !/^new /i.test(b.getAttribute("title") ?? ""));
    if (buttons.length === 0) return;
    const dir = (e.key === "ArrowDown" || e.key === "j") ? 1 : -1;
    const idx = buttons.indexOf(document.activeElement as HTMLElement);
    const nextIdx = idx < 0
      ? (dir === 1 ? 0 : buttons.length - 1)
      : (idx + dir + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
  }

  const roomById     = Object.fromEntries(rooms.map(r => [r.id!, r]));
  const locationById = Object.fromEntries(locations.map(l => [l.id!, l]));

  const categories = [...new Set(
    items.map(i => i.category).filter((c): c is string => !!c)
  )].sort();

  const search = searchTerm.trim().toLowerCase();
  const visibleItems = items.filter(item => {
    if (filterRoomId !== null && item.roomId !== filterRoomId) return false;
    if (filterCategory !== null && item.category !== filterCategory) return false;
    if (search) {
      const haystack = `${item.name ?? ""} ${item.description ?? ""} ${item.category ?? ""} ${item.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const activeRoom     = filterRoomId != null ? roomById[filterRoomId] : null;
  const activeLocation = activeRoom?.locationId != null ? locationById[activeRoom.locationId] : null;

  const defaultNewRoomId = filterRoomId ?? rooms[0]?.id ?? undefined;

  const focusedItem  = panel?.mode === "view" || panel?.mode === "edit" ? panel.item : null;
  const viewRoom     = focusedItem?.roomId != null ? roomById[focusedItem.roomId] : null;
  const viewLocation = viewRoom?.locationId != null ? locationById[viewRoom.locationId] : null;

  const openNewItem = useCallback(() => {
    if (rooms.length === 0) {
      setPanel(locations.length === 0 ? { mode: "new-location" } : { mode: "new-room" });
    } else {
      setPanel({ mode: "new-item", roomId: defaultNewRoomId ?? rooms[0]!.id! });
    }
  }, [rooms, locations, defaultNewRoomId]);

  const handleItemSaved = useCallback((saved: ItemResponse) => {
    setPanel({ mode: "view", item: saved });
  }, []);

  const handleItemDeleted = useCallback(() => {
    setPanel(null);
  }, []);

  const handleLocationCreated = useCallback((loc: LocationResponse) => {
    setPanel({ mode: "new-room", locationId: loc.id });
  }, []);

  const handleRoomCreated = useCallback((room: RoomResponse) => {
    setPanel({ mode: "new-item", roomId: room.id! });
  }, []);

  const stats = [
    { label: "Total items", value: items.length },
    { label: "Locations",   value: locations.length },
    { label: "Rooms",       value: rooms.length },
    { label: "Categories",  value: categories.length },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Pane focus shortcuts — handled BEFORE the input-focus guard so they
      // work even while typing in the inline editor.
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4")) {
        e.preventDefault();
        if (e.key === "4") { setTerminalOpen(o => !o); return; }
        const root =
          e.key === "1" ? navRef.current
          : e.key === "2" ? itemsRef.current
          : (document.querySelector<HTMLElement>(".tui-detail")
              ?? document.querySelector<HTMLElement>(".cs-body > aside.tui-panel:nth-of-type(2)"));
        focusFirstIn(root);
        return;
      }

      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // When focus is inside the sidebar, the sidebar's own onKeyDown handles
      // arrow navigation and Enter/Space activation — don't run global shortcuts.
      if (navRef.current?.contains(e.target as Node)) return;

      // ? — open help (Shift+/ on most layouts)
      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      // / — open filter
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      // : — open terminal (vim-style ex command line)
      if (e.key === ":") {
        e.preventDefault();
        setTerminalOpen(true);
        return;
      }

      // Cancel any pending 'g' if the next key isn't 'g'
      const hadPendingG = pendingGRef.current !== null;
      if (e.key !== "g" && hadPendingG) {
        clearTimeout(pendingGRef.current!);
        pendingGRef.current = null;
      }

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
        case "g": {
          e.preventDefault();
          if (hadPendingG) {
            // Second 'g' — go to first item
            clearTimeout(pendingGRef.current!);
            pendingGRef.current = null;
            const first = visibleItems[0];
            if (first) setPanel({ mode: "view", item: first });
          } else {
            // First 'g' — wait briefly for a second
            pendingGRef.current = window.setTimeout(() => { pendingGRef.current = null; }, 800);
          }
          break;
        }
        case "G": {
          e.preventDefault();
          const last = visibleItems[visibleItems.length - 1];
          if (last) setPanel({ mode: "view", item: last });
          break;
        }
        case "e": {
          if (panel?.mode === "view") {
            e.preventDefault();
            setPanel({ mode: "edit", item: panel.item });
          }
          break;
        }
        case "d": {
          if (panel?.mode === "view") {
            e.preventDefault();
            const item = panel.item;
            if (confirm(`Delete "${item.name}"?`)) {
              setPanel(null);
              deleteFetcher.submit(
                { _intent: "delete-item", itemId: String(item.id) },
                { method: "post" },
              );
            }
          }
          break;
        }
        case "o": {
          e.preventDefault();
          openNewItem();
          break;
        }
        case "Escape": {
          if (search || searchOpen) {
            setSearchTerm("");
            setSearchOpen(false);
          } else {
            setPanel(null);
          }
          break;
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, visibleItems, openNewItem, deleteFetcher, search, searchOpen]);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden", minHeight: 0, background: "var(--c-bg)",
    }}>

      <Win98MenuBar />
      <CDEMenuBar />

      {/* Stats row */}
      <div className="cs-stats-row" style={{
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
      <div className="cs-toolbar" style={{
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

      <TuiTopBar
        locationPath={
          activeLocation && activeRoom
            ? `${activeLocation.name?.toLowerCase()}/${activeRoom.name?.toLowerCase()}`
            : activeLocation
              ? `${activeLocation.name?.toLowerCase()}`
              : "all items"
        }
        itemCount={items.length}
      />

      {/* Body: TUI = sidebar + (table over detail); other themes = sidebar + table + right drawer */}
      <div className="cs-body" style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <TuiPanel as="aside" title="─[ rooms ]─" style={{
          width: 200, borderRight: "1px solid var(--c-border)",
          background: "var(--c-bg-2)", padding: "14px 0",
          flexShrink: 0,
          display: "flex", flexDirection: "column",
          minHeight: 0,
        }}>
          <div ref={navRef} onKeyDown={onSidebarKeyDown} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {isWin98 ? (
              <Win98Tree
                locations={locations}
                rooms={rooms}
                items={items}
                categories={categories}
                filterRoomId={filterRoomId}
                filterCategory={filterCategory}
                onSelectRoom={(id) => {
                  setFilterRoomId(filterRoomId === id ? null : id);
                  setFilterCategory(null);
                }}
                onSelectCategory={(name) => {
                  setFilterCategory(filterCategory === name ? null : name);
                  setFilterRoomId(null);
                }}
                onAddRoom={(locationId) => setPanel({ mode: "new-room", locationId })}
              />
            ) : (
              <>
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
              </>
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

        {/* Center column: optional search bar, table, optional TUI detail strip */}
        <div ref={itemsRef} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {searchOpen && (
            <TuiSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClose={(clear) => {
                if (clear) setSearchTerm("");
                setSearchOpen(false);
              }}
            />
          )}
          {isTui ? (
            visibleItems.length === 0 ? (
              <TuiPanel title="─[ items · 0 ]─" style={{ flex: 1, minWidth: 0, background: "var(--c-bg)" }}>
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
              </TuiPanel>
            ) : (
              <TuiItemTable
                items={visibleItems}
                roomById={roomById}
                selectedId={panel?.mode === "view" ? (panel.item.id ?? null) : null}
                onSelect={item => {
                  const same = panel?.mode === "view" && panel.item.id === item.id;
                  setPanel(same ? null : { mode: "view", item });
                }}
                totalCount={items.length}
              />
            )
          ) : (
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
          )}

          {/* TUI bottom strip — view (read-only) or edit (inline form) */}
          {isTui && panel?.mode === "view" && (
            <TuiItemDetail
              item={panel.item}
              room={viewRoom}
              location={viewLocation}
              onEdit={() => setPanel({ mode: "edit", item: panel.item })}
              onDelete={() => {
                setPanel(null);
                deleteFetcher.submit(
                  { _intent: "delete-item", itemId: String(panel.item.id) },
                  { method: "post" },
                );
              }}
            />
          )}
          {isTui && panel?.mode === "edit" && (
            <TuiItemEdit
              item={panel.item}
              rooms={rooms}
              locations={locations}
              onCancel={() => setPanel({ mode: "view", item: panel.item })}
              onSaved={(saved) => setPanel({ mode: "view", item: saved })}
              onDelete={() => {
                if (!confirm(`Delete "${panel.item.name}"?`)) return;
                setPanel(null);
                deleteFetcher.submit(
                  { _intent: "delete-item", itemId: String(panel.item.id) },
                  { method: "post" },
                );
              }}
            />
          )}
        </div>

        {/* Right panel — non-TUI themes only */}
        {!isTui && panel?.mode === "view" && (
          <ItemViewPanel
            item={panel.item}
            room={viewRoom}
            location={viewLocation}
            onClose={() => setPanel(null)}
            onEdit={() => setPanel({ mode: "edit", item: panel.item })}
            onDelete={() => {
              setPanel(null);
              deleteFetcher.submit(
                { _intent: "delete-item", itemId: String(panel.item.id) },
                { method: "post" },
              );
            }}
          />
        )}
        {(panel?.mode === "new-item" || (!isTui && panel?.mode === "edit")) && (
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
      <TuiStatusBar onOpenTerminal={() => setTerminalOpen(o => !o)} />
      <Win98StatusBar count={visibleItems.length} location={activeLocation} room={activeRoom} />
      <CDEFootRow onNewItem={openNewItem} />
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      <TuiTerminal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        items={items}
        rooms={rooms}
        locations={locations}
        currentFilter={searchTerm}
        onFilter={(text) => {
          setSearchTerm(text);
          setSearchOpen(text !== "");
        }}
      />
    </div>
  );
}

function focusFirstIn(root: HTMLElement | null) {
  if (!root) return;
  const selected = root.querySelector<HTMLElement>('[data-selected="true"]');
  if (selected) { selected.focus(); return; }
  const focusable = root.querySelector<HTMLElement>(
    'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  focusable?.focus();
}

function TuiTopBar({ locationPath, itemCount }: { locationPath: string; itemCount: number }) {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const { line: version, sha } = getVersionLine();
  return (
    <div className="cs-tui-topbar">
      <span className="cs-tui-topbar-left">
        <span className="cs-tui-topbar-bracket">╭─[ </span>
        <strong>clutter<span style={{ color: "#c4502a" }}>:stock</span></strong>
        <span className="cs-tui-topbar-bracket"> ]─[ </span>
        <span className="cs-tui-topbar-path">{locationPath}</span>
        <span className="cs-tui-topbar-bracket"> ]</span>
      </span>
      <span className="cs-tui-topbar-right" title={sha || undefined}>
        {version && `${version} · `}{itemCount} items{time && ` · synced ${time}`}
      </span>
    </div>
  );
}

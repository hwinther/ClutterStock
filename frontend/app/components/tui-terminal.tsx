import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouteLoaderData } from "react-router";
import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";
import type { SessionUser } from "~/lib/session.server";

type Line = { kind: "in" | "out" | "err" | "info"; text: string };

const INTRO: Line[] = [
  { kind: "info", text: "ClutterStock terminal" },
  { kind: "info", text: "type 'help' for commands · 'clear' to wipe · Esc to close" },
];

export function TuiTerminal({ open, onClose, items, rooms, locations, currentFilter, onFilter }: {
  open: boolean;
  onClose: () => void;
  items: ItemResponse[];
  rooms: RoomResponse[];
  locations: LocationResponse[];
  currentFilter: string;
  onFilter: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Line[]>(INTRO);
  const [value, setValue] = useState("");
  const rootData = useRouteLoaderData("root") as { user: SessionUser | null } | undefined;
  const user = rootData?.user ?? null;
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  if (!open) return null;

  function run(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const echo: Line = { kind: "in", text: `$ ${trimmed}` };

    if (trimmed === "clear" || trimmed === "cls") {
      setHistory([]);
      return;
    }
    if (trimmed === "exit" || trimmed === "q" || trimmed === ":q") {
      onClose();
      return;
    }

    const args = trimmed.split(/\s+/);
    const head = args[0]!.toLowerCase();
    const rest = trimmed.slice(args[0]!.length).trim();

    if (trimmed === "help" || trimmed === "?") {
      setHistory(h => [
        ...h, echo,
        { kind: "out", text: "available commands:" },
        { kind: "out", text: "  help                this list" },
        { kind: "out", text: "  clear / cls         wipe scrollback" },
        { kind: "out", text: "  exit / q / :q       close terminal" },
        { kind: "out", text: "  list rooms          show all rooms" },
        { kind: "out", text: "  list items          show all items" },
        { kind: "out", text: "  filter <text>       narrow visible items" },
        { kind: "out", text: "  filter              clear filter" },
        { kind: "out", text: "  whoami              show current user" },
        { kind: "out", text: "  logout / signout    sign out" },
      ]);
      return;
    }

    if (head === "whoami") {
      const lines = whoami(user);
      setHistory(h => [...h, echo, ...lines]);
      return;
    }

    if (head === "logout" || head === "signout") {
      setHistory(h => [...h, echo, { kind: "info", text: "signing out…" }]);
      onClose();
      // Defer slightly so the user sees the message before the redirect
      setTimeout(() => navigate("/auth/signout"), 50);
      return;
    }

    if (head === "list") {
      const sub = (args[1] ?? "").toLowerCase();
      if (sub === "rooms") {
        const lines = listRooms(rooms, locations, items);
        setHistory(h => [...h, echo, ...lines]);
        return;
      }
      if (sub === "items") {
        const lines = listItems(items, rooms);
        setHistory(h => [...h, echo, ...lines]);
        return;
      }
      setHistory(h => [...h, echo, { kind: "err", text: "usage: list rooms | list items" }]);
      return;
    }

    if (head === "filter") {
      onFilter(rest);
      const out: Line = rest
        ? { kind: "out", text: `filter set: "${rest}"` }
        : currentFilter
          ? { kind: "out", text: `filter cleared (was "${currentFilter}")` }
          : { kind: "out", text: "filter is empty" };
      setHistory(h => [...h, echo, out]);
      return;
    }

    setHistory(h => [...h, echo, { kind: "err", text: `unknown command: ${args[0]}  (try 'help')` }]);
  }

  // (helpers `listRooms` / `listItems` are defined below)
  return (
    <div className="tui-terminal" role="region" aria-label="Terminal">
      <span className="tui-panel-title">─[ terminal ]─</span>
      <button
        type="button"
        onClick={onClose}
        className="tui-terminal-close"
        aria-label="Close terminal"
      >[x]</button>

      <div ref={scrollRef} className="tui-terminal-history">
        {history.map((line, i) => (
          <div key={i} className={`tui-terminal-line tui-terminal-line--${line.kind}`}>
            {line.text}
          </div>
        ))}
      </div>

      <form
        className="tui-terminal-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
          setValue("");
        }}
      >
        <span className="tui-terminal-sigil">$</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }
          }}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="tui-terminal-input"
          aria-label="Command"
        />
        <span className="tui-cursor">▌</span>
      </form>
    </div>
  );
}

function pad(s: string, width: number): string {
  if (s.length >= width) return s.slice(0, width - 1) + "…";
  return s + " ".repeat(width - s.length);
}

function whoami(user: SessionUser | null): Line[] {
  if (!user) return [{ kind: "err", text: "(unauthenticated)" }];
  const groups = (user.groups ?? []).filter(Boolean);
  const rows: [string, string][] = [
    ["user",     user.name ?? user.preferred_username ?? user.sub],
    ["username", user.preferred_username ?? "(none)"],
    ["email",    user.email ?? "(none)"],
    ["groups",   groups.length > 0 ? groups.join(", ") : "(none)"],
    ["sub",      user.sub],
  ];
  return rows.map(([k, v]) => ({ kind: "out", text: `${pad(k, 10)}: ${v}` }));
}

function listRooms(rooms: RoomResponse[], locations: LocationResponse[], items: ItemResponse[]): Line[] {
  const locationById = new Map(locations.map(l => [l.id, l]));
  const lines: Line[] = [
    { kind: "out", text: pad("ID", 5) + pad("LOCATION", 22) + pad("ROOM", 24) + "ITEMS" },
  ];
  if (rooms.length === 0) {
    lines.push({ kind: "out", text: "(no rooms)" });
    return lines;
  }
  for (const r of rooms) {
    const loc = r.locationId != null ? locationById.get(r.locationId) : null;
    const count = items.filter(i => i.roomId === r.id).length;
    lines.push({
      kind: "out",
      text:
        pad(String(r.id ?? "—"), 5) +
        pad(loc?.name ?? "—", 22) +
        pad(r.name ?? "—", 24) +
        String(count),
    });
  }
  lines.push({ kind: "out", text: `${rooms.length} room${rooms.length === 1 ? "" : "s"}` });
  return lines;
}

function listItems(items: ItemResponse[], rooms: RoomResponse[]): Line[] {
  const roomById = new Map(rooms.map(r => [r.id, r]));
  const lines: Line[] = [
    { kind: "out", text: pad("ID", 6) + pad("NAME", 28) + pad("ROOM", 18) + "CATEGORY" },
  ];
  if (items.length === 0) {
    lines.push({ kind: "out", text: "(no items)" });
    return lines;
  }
  // Cap at 200 lines to keep scrollback manageable
  const max = 200;
  const head = items.slice(0, max);
  for (const it of head) {
    const room = it.roomId != null ? roomById.get(it.roomId) : null;
    lines.push({
      kind: "out",
      text:
        pad(String(it.id ?? "—").padStart(3, "0"), 6) +
        pad(it.name ?? "—", 28) +
        pad(room?.name ?? "—", 18) +
        (it.category ?? "—"),
    });
  }
  if (items.length > max) {
    lines.push({ kind: "out", text: `… ${items.length - max} more (use 'filter <text>' to narrow)` });
  }
  lines.push({ kind: "out", text: `${items.length} item${items.length === 1 ? "" : "s"}` });
  return lines;
}

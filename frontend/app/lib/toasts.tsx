import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastInput {
  kind: ToastKind;
  message: string;
  title?: string;
  ttlMs?: number;
}

export interface Toast extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toasts: readonly Toast[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_TTL_MS = 5000;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `t-${Date.now().toString(36)}-${nextId}`;
}

export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((input: ToastInput): string => {
    const id = makeId();
    setToasts((prev) => [...prev, { ...input, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Drains server-side flash toasts (from the root loader) onto the client
 * toast queue. Lives inside the provider, watches an array of flashes that
 * may change on every navigation, and uses array identity to detect a fresh
 * batch. Render this in the layout — once.
 */
export function FlashToasts({
  flashes,
}: {
  readonly flashes: readonly ToastInput[];
}) {
  const { push } = useToasts();
  const lastSeen = useRef<readonly ToastInput[] | null>(null);
  useEffect(() => {
    if (flashes === lastSeen.current) return;
    lastSeen.current = flashes;
    for (const f of flashes) push(f);
  }, [flashes, push]);
  return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used inside <ToastProvider>");
  return ctx;
}

/**
 * When a route action returns `{ ok: false, error }` (the in-page validation
 * shape from action-helpers.server), push it as an error toast — once per
 * actionData identity so re-renders don't spam.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToastFromActionData(actionData: unknown): void {
  const { push } = useToasts();
  const lastSeen = useRef<unknown>(null);
  useEffect(() => {
    if (actionData == null) {
      lastSeen.current = null;
      return;
    }
    if (actionData === lastSeen.current) return;
    lastSeen.current = actionData;
    if (typeof actionData === "object" && "error" in actionData) {
      const error = (actionData as { error?: unknown }).error;
      if (typeof error === "string" && error.length > 0) {
        push({ kind: "error", message: error });
      }
    }
  }, [actionData, push]);
}

function ToastItem({ toast }: { readonly toast: Toast }) {
  const { dismiss } = useToasts();
  const ttl = toast.ttlMs ?? DEFAULT_TTL_MS;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => dismiss(toast.id), ttl);
  }, [dismiss, toast.id, ttl]);

  const stop = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const accent =
    toast.kind === "success"
      ? "var(--c-accent)"
      : toast.kind === "error"
        ? "var(--c-danger)"
        : "var(--c-fg-2)";

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      onMouseEnter={stop}
      onMouseLeave={start}
      style={{
        background: "var(--c-bg-2)",
        color: "var(--c-fg)",
        border: "1px solid var(--c-border)",
        borderLeft: `3px solid ${accent}`,
        padding: "0.625rem 0.75rem",
        minWidth: "16rem",
        maxWidth: "24rem",
        display: "flex",
        gap: "0.5rem",
        alignItems: "flex-start",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 600, marginBottom: "0.125rem" }}>{toast.title}</div>
        )}
        <div style={{ wordWrap: "break-word" }}>{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          border: 0,
          color: "var(--c-fg-3)",
          cursor: "pointer",
          padding: "0 0.25rem",
          fontSize: "1rem",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div
      // Fixed bottom-right viewport. Inherits the active data-theme via CSS vars.
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}

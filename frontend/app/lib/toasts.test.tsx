import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FlashToasts,
  ToastProvider,
  Toaster,
  useToastFromActionData,
  useToasts,
} from "./toasts";

function Harness({ children }: { readonly children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toaster />
    </ToastProvider>
  );
}

function PushButton({ message }: { readonly message: string }) {
  const { push } = useToasts();
  return (
    <button onClick={() => push({ kind: "success", message })}>push</button>
  );
}

function ActionDataConsumer({ data }: { readonly data: unknown }) {
  useToastFromActionData(data);
  return null;
}

describe("ToastProvider + useToasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there are no toasts", () => {
    render(
      <Harness>
        <span>placeholder</span>
      </Harness>,
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("FlashToasts drains a server-side flash payload onto the queue", async () => {
    render(
      <ToastProvider>
        <FlashToasts flashes={[{ kind: "success", message: "Welcome back" }]} />
        <Toaster />
      </ToastProvider>,
    );
    // FlashToasts pushes inside useEffect — flush effects.
    await act(async () => {});
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("FlashToasts re-pushes when a fresh array identity arrives (post-redirect navigation)", async () => {
    const first = [{ kind: "success" as const, message: "first" }];
    const { rerender } = render(
      <ToastProvider>
        <FlashToasts flashes={first} />
        <Toaster />
      </ToastProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("first")).toBeInTheDocument();

    // Same identity — no re-push.
    rerender(
      <ToastProvider>
        <FlashToasts flashes={first} />
        <Toaster />
      </ToastProvider>,
    );
    await act(async () => {});
    expect(screen.getAllByText("first")).toHaveLength(1);

    // New array (a new loader run after a redirect) — push the new batch.
    rerender(
      <ToastProvider>
        <FlashToasts flashes={[{ kind: "success", message: "second" }]} />
        <Toaster />
      </ToastProvider>,
    );
    await act(async () => {});
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("auto-dismisses after the default 5 seconds", async () => {
    const { getByRole } = render(
      <ToastProvider>
        <PushButton message="ping" />
        <Toaster />
      </ToastProvider>,
    );
    await act(async () => {
      getByRole("button", { name: "push" }).click();
    });
    expect(screen.getByText("ping")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("ping")).toBeNull();
  });

  it("push() renders a new toast that the user can dismiss manually", async () => {
    const { getByRole } = render(
      <Harness>
        <PushButton message="saved" />
      </Harness>,
    );

    await act(async () => {
      getByRole("button", { name: "push" }).click();
    });
    expect(screen.getByText("saved")).toBeInTheDocument();

    await act(async () => {
      getByRole("button", { name: "Dismiss" }).click();
    });
    expect(screen.queryByText("saved")).toBeNull();
  });
});

describe("useToastFromActionData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pushes an error toast when actionData has an error string", () => {
    const data = { ok: false, error: "Name is required" };
    render(
      <Harness>
        <ActionDataConsumer data={data} />
      </Harness>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("does not re-push when re-rendered with the same actionData identity", () => {
    const data = { ok: false, error: "boom" };
    const { rerender } = render(
      <Harness>
        <ActionDataConsumer data={data} />
      </Harness>,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);

    rerender(
      <Harness>
        <ActionDataConsumer data={data} />
      </Harness>,
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("does nothing for ok results", () => {
    render(
      <Harness>
        <ActionDataConsumer data={{ ok: true, data: {} }} />
      </Harness>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

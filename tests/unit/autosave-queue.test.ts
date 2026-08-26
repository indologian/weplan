import { describe, expect, it, vi } from "vitest";
import { AutosaveQueue } from "@/modules/invitation/autosave-queue";

describe("autosave queue", () => {
  it("serializes requests and persists an edit made during an active request", async () => {
    let resolveFirst: ((value: { success: true; contentVersion: number }) => void) | undefined;
    const persist = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ success: true, contentVersion: 3 });
    const queue = new AutosaveQueue(1, persist);

    queue.markDirty("first");
    const firstFlush = queue.flush();
    queue.markDirty("latest");
    expect(persist).toHaveBeenCalledTimes(1);
    resolveFirst?.({ success: true, contentVersion: 2 });
    await firstFlush;

    expect(persist).toHaveBeenNthCalledWith(2, "latest", 2);
    expect(queue.state).toMatchObject({ contentVersion: 3, localEditGeneration: 2, lastAckedGeneration: 2 });
  });

  it("stops at a version conflict and preserves the dirty generation", async () => {
    const queue = new AutosaveQueue(4, vi.fn().mockResolvedValue({
      success: false,
      code: "VERSION_CONFLICT",
    }));

    queue.markDirty("local change");
    await expect(queue.flush()).resolves.toEqual({ success: false, code: "VERSION_CONFLICT" });
    expect(queue.state).toMatchObject({ pendingSave: false, localEditGeneration: 1, lastAckedGeneration: 0, contentVersion: 4 });
  });

  it("does not start a second request when a flush is already active", async () => {
    let resolve: (() => void) | undefined;
    const persist = vi.fn(() => new Promise<{ success: true; contentVersion: number }>((done) => {
      resolve = () => done({ success: true, contentVersion: 2 });
    }));
    const queue = new AutosaveQueue(1, persist);
    queue.markDirty("change");
    const firstFlush = queue.flush();
    await expect(queue.flush()).resolves.toBeNull();
    expect(persist).toHaveBeenCalledTimes(1);
    resolve?.();
    await firstFlush;
  });

  it("returns null when flush is called without any pending changes", async () => {
    const persist = vi.fn();
    const queue = new AutosaveQueue(1, persist);
    await expect(queue.flush()).resolves.toBeNull();
    expect(persist).not.toHaveBeenCalled();
  });

  it("stops on TEMPORARY_ERROR and preserves the dirty state", async () => {
    const queue = new AutosaveQueue(1, vi.fn().mockResolvedValue({
      success: false,
      code: "TEMPORARY_ERROR",
    }));

    queue.markDirty("change");
    const result = await queue.flush();
    expect(result).toEqual({ success: false, code: "TEMPORARY_ERROR" });
    expect(queue.state).toMatchObject({
      isSaving: false,
      pendingSave: false,
      localEditGeneration: 1,
      lastAckedGeneration: 0,
      contentVersion: 1,
    });
  });

  it("accumulates multiple dirty marks into a single flush with the latest snapshot", async () => {
    const persist = vi.fn().mockResolvedValue({ success: true, contentVersion: 2 });
    const queue = new AutosaveQueue(1, persist);

    queue.markDirty("v1");
    queue.markDirty("v2");
    queue.markDirty("v3");

    await queue.flush();

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith("v3", 1);
    expect(queue.state).toMatchObject({ contentVersion: 2, localEditGeneration: 3, lastAckedGeneration: 3 });
  });

  it("recovers after a temporary error when the next flush succeeds", async () => {
    const persist = vi.fn()
      .mockResolvedValueOnce({ success: false, code: "TEMPORARY_ERROR" })
      .mockResolvedValueOnce({ success: true, contentVersion: 2 });
    const queue = new AutosaveQueue(1, persist);

    queue.markDirty("change");
    await queue.flush();

    expect(queue.state.pendingSave).toBe(false);
    expect(queue.state.lastAckedGeneration).toBe(0);

    queue.markDirty("retry");
    await queue.flush();

    expect(queue.state).toMatchObject({ contentVersion: 2, localEditGeneration: 2, lastAckedGeneration: 2 });
  });

  it("correctly tracks generations across multiple save cycles", async () => {
    const persist = vi.fn()
      .mockResolvedValueOnce({ success: true, contentVersion: 2 })
      .mockResolvedValueOnce({ success: true, contentVersion: 3 });
    const queue = new AutosaveQueue(1, persist);

    queue.markDirty("first");
    await queue.flush();
    expect(queue.state).toMatchObject({ localEditGeneration: 1, lastAckedGeneration: 1, contentVersion: 2 });

    queue.markDirty("second");
    queue.markDirty("third");
    await queue.flush();
    expect(queue.state).toMatchObject({ localEditGeneration: 3, lastAckedGeneration: 3, contentVersion: 3 });
  });

  it("sends the correct version after a successful save updates the version", async () => {
    const persist = vi.fn()
      .mockResolvedValueOnce({ success: true, contentVersion: 5 })
      .mockResolvedValueOnce({ success: true, contentVersion: 6 });
    const queue = new AutosaveQueue(1, persist);

    queue.markDirty("first");
    await queue.flush();
    expect(persist).toHaveBeenNthCalledWith(1, "first", 1);

    queue.markDirty("second");
    await queue.flush();
    expect(persist).toHaveBeenNthCalledWith(2, "second", 5);
    expect(queue.state.contentVersion).toBe(6);
  });
});
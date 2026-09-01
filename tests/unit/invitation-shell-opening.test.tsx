/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { InvitationShell } from "@/modules/theme/primitives/invitation-shell";

describe("InvitationShell Opening Transition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    // Mock HTMLMediaElement.play
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(async () => {});
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.style.overflow = "";
  });

  it("should start closed, become opening on click, and open on transition end", async () => {
    render(
      <InvitationShell className="test" guestName="John Doe" audioUrl="/test.mp3">
        <div data-testid="content" />
      </InvitationShell>
    );

    const gate = screen.getByRole("dialog");
    const button = screen.getByRole("button", { name: /Buka Undangan/i });
    const content = screen.getByTestId("content").parentElement!;

    // Initial closed state
    expect(gate.getAttribute("data-state")).toBe("closed");
    expect(content.getAttribute("inert")).toBe(""); // true
    expect(content.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");

    // Click
    await act(async () => {
      fireEvent.click(button);
    });

    // Opening state
    expect(gate.getAttribute("data-state")).toBe("opening");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(content.getAttribute("inert")).toBe(""); // true
    expect(content.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    // Transition end
    await act(async () => {
      fireEvent.transitionEnd(gate, { propertyName: "transform" });
    });

    // Open state
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(content.getAttribute("inert")).toBeNull();
    expect(content.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.style.overflow).toBe("");
  });

  it("should open immediately with reduced motion", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
      })),
    });

    render(
      <InvitationShell className="test" guestName="John Doe" audioUrl="/test.mp3">
        <div data-testid="content" />
      </InvitationShell>
    );

    const button = screen.getByRole("button", { name: /Buka Undangan/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should fallback to open state if transitionend is lost", async () => {
    render(
      <InvitationShell className="test" guestName="John Doe" audioUrl="/test.mp3">
        <div data-testid="content" />
      </InvitationShell>
    );

    const button = screen.getByRole("button", { name: /Buka Undangan/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByRole("dialog").getAttribute("data-state")).toBe("opening");

    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});




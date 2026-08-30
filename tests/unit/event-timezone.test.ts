
import { describe, expect, it } from "vitest";
import { formatForInput, buildIsoString } from "@/modules/invitation/components/editor/steps/event-step";

describe("Event timezone transformations", () => {
  it("round-trips wall-clock times in Asia/Jakarta correctly", () => {
    const wallClock = "2026-08-26T09:00";
    const ianaTz = "Asia/Jakarta"; // UTC+7
    
    // Convert to ISO
    const isoString = buildIsoString(wallClock, ianaTz);
    expect(isoString).toBe("2026-08-26T09:00:00+07:00");
    
    // Convert back to wall-clock
    const restored = formatForInput(isoString, ianaTz);
    expect(restored).toBe(wallClock);
  });

  it("round-trips wall-clock times in Asia/Makassar correctly", () => {
    const wallClock = "2026-08-26T10:00";
    const ianaTz = "Asia/Makassar"; // UTC+8
    
    const isoString = buildIsoString(wallClock, ianaTz);
    expect(isoString).toBe("2026-08-26T10:00:00+08:00");
    
    const restored = formatForInput(isoString, ianaTz);
    expect(restored).toBe(wallClock);
  });

  it("round-trips wall-clock times in Asia/Jayapura correctly", () => {
    const wallClock = "2026-08-26T11:00";
    const ianaTz = "Asia/Jayapura"; // UTC+9
    
    const isoString = buildIsoString(wallClock, ianaTz);
    expect(isoString).toBe("2026-08-26T11:00:00+09:00");
    
    const restored = formatForInput(isoString, ianaTz);
    expect(restored).toBe(wallClock);
  });
});


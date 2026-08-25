import { describe, expect, it } from "vitest";
import { findClientServerBoundaryViolations } from "../../scripts/verify-boundaries";

describe("client/server boundary", () => {
  it("rejects a client import from a server-only module", () => {
    const source = `'use client';\nimport { getServerEnv } from '@/shared/lib/env/server';`;
    expect(findClientServerBoundaryViolations(source, "fixture.tsx")).toHaveLength(1);
  });

  it("allows public environment imports", () => {
    const source = `'use client';\nimport { getPublicEnv } from '@/shared/lib/env/public';`;
    expect(findClientServerBoundaryViolations(source, "fixture.tsx")).toEqual([]);
  });
});

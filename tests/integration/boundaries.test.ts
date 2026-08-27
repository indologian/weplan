import { describe, expect, it } from "vitest";
import { findClientServerBoundaryViolations, findDomainDependencyCycles } from "../../scripts/verify-boundaries";

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

describe("domain dependency boundaries", () => {
  it("detects a cycle between domains", () => {
    expect(findDomainDependencyCycles([
      { fileName: "src/modules/invitation/a.ts", source: 'import "@/modules/theme/a";' },
      { fileName: "src/modules/theme/a.ts", source: 'import "@/modules/invitation/a";' },
    ])).toEqual(["domain dependency cycle: invitation -> theme -> invitation"]);
  });

  it("allows a one-way domain dependency", () => {
    expect(findDomainDependencyCycles([
      { fileName: "src/modules/theme/a.ts", source: 'import "@/modules/invitation/types";' },
      { fileName: "src/modules/invitation/a.ts", source: 'import "@/config/renderer-keys";' },
    ])).toEqual([]);
  });
});

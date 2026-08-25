import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const middlewarePath = "src/middleware.ts";
const middlewareSource = readFileSync(middlewarePath, "utf8");
const clientSource = readFileSync("src/shared/lib/supabase/middleware-client.ts", "utf8");

describe("Edge middleware compatibility boundary", () => {
  it("uses legacy Middleware instead of the unsupported Node Proxy", () => {
    expect(existsSync(middlewarePath)).toBe(true);
    expect(existsSync("src/proxy.ts")).toBe(false);
    expect(middlewareSource).toContain("export async function middleware");
  });

  it("limits the gate to verified identity and coarse route matching", () => {
    expect(middlewareSource).toContain("supabase.auth.getClaims()");
    expect(middlewareSource).toContain('pathname.startsWith("/dashboard")');
    expect(middlewareSource).toContain('pathname.startsWith("/admin")');
    expect(middlewareSource).not.toMatch(/user_metadata|app_metadata|user_profiles|role\s*[=.:]/);
  });

  it("refreshes cookies with public credentials only", () => {
    expect(clientSource).toContain("createServerClient");
    expect(clientSource).toContain("request.cookies.getAll()");
    expect(clientSource).toContain("response.cookies.set");
    expect(clientSource).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(clientSource).not.toContain("SUPABASE_SECRET_KEY");
  });
});

import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/shared/lib/env/public";

describe("public environment", () => {
  it("accepts the documented public variables", () => {
    expect(parsePublicEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test_site_key",
    })).toMatchObject({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
  });

  it("rejects missing configuration", () => {
    expect(() => parsePublicEnv({})).toThrow();
  });
});

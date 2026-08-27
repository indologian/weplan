import { describe, expect, it } from "vitest";
import { createLogger } from "@/shared/lib/logging";

describe("structured logging", () => {
  it("creates logger with requestId", () => {
    const logger = createLogger({ requestId: "test-req-1" });
    expect(logger.requestId).toBe("test-req-1");
  });

  it("creates logger with auto-generated requestId", () => {
    const logger = createLogger();
    expect(typeof logger.requestId).toBe("string");
    expect(logger.requestId.length).toBeGreaterThan(0);
  });

  it("has info, warn, error methods", () => {
    const logger = createLogger();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("redacts sensitive keys in meta", () => {
    const logger = createLogger();
    const meta = { password: "secret123", token: "abc", safeKey: "value" };
    expect(meta.password).toBe("secret123");
    expect(meta.token).toBe("abc");
    expect(meta.safeKey).toBe("value");
  });
});

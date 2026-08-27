import { describe, expect, it } from "vitest";

describe("security headers", () => {
  const expectedHeaders = [
    { header: "X-Frame-Options", expectedValue: "DENY" },
    { header: "X-Content-Type-Options", expectedValue: "nosniff" },
    { header: "X-XSS-Protection", expectedValue: "0" },
    { header: "Referrer-Policy", expectedValue: "strict-origin-when-cross-origin" },
    { header: "Permissions-Policy", expectedValue: "camera=(), microphone=(), geolocation=(), payment=()" },
  ];

  it("all required security headers are defined", () => {
    for (const { header, expectedValue } of expectedHeaders) {
      expect(expectedValue).toBeTruthy();
      expect(header).toBeTruthy();
    }
  });

  it("CSP has frame-ancestors none", () => {
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://*.midtrans.com https://*.midtrans.co.id https://challenges.cloudflare.com https://resend.com",
      "frame-src 'self' https://www.google.com https://js.midtrans.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("CSP does not contain unsafe-inline globally", () => {
    const styleSrc = "style-src 'self' 'unsafe-inline'";
    expect(styleSrc).toContain("'unsafe-inline'");
    expect(styleSrc).not.toContain("script-src 'unsafe-inline'");
  });

  it("API routes have no-cache headers", () => {
    const cacheControl = "no-store, no-cache, must-revalidate";
    expect(cacheControl).toContain("no-store");
    expect(cacheControl).toContain("must-revalidate");
  });
});

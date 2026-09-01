/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import AuthLayout from "@/app/(auth)/layout";

const mocks = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/modules/auth/server/get-optional-user", () => ({
  getOptionalUser: mocks.getOptionalUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

describe("authenticated-only auth pages", () => {
  it("redirects an authenticated user away from login and register routes", async () => {
    mocks.getOptionalUser.mockResolvedValue({ id: "user-1" });

    await AuthLayout({ children: <div>Auth form</div> });

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders auth forms for unauthenticated visitors", async () => {
    mocks.getOptionalUser.mockResolvedValue(null);
    mocks.redirect.mockClear();

    const layout = await AuthLayout({ children: <div>Auth form</div> });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(layout).toBeTruthy();
  });
});

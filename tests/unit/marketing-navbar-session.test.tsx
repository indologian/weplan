/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarketingNavbar } from "@/app/(marketing)/_components/marketing-navbar";

describe("MarketingNavbar session-aware actions", () => {
  afterEach(cleanup);

  it("shows Dashboard on desktop and mobile for an authenticated user", async () => {
    render(<MarketingNavbar isAuthenticated />);

    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href"))
      .toBe("/dashboard");
    expect(screen.queryByRole("link", { name: "Masuk" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Buka menu navigasi" }));

    const mobileMenu = await screen.findByRole("dialog");
    expect(within(mobileMenu).getByRole("link", { name: "Dashboard" }).getAttribute("href"))
      .toBe("/dashboard");
  });

  it("shows Masuk for an unauthenticated visitor", () => {
    render(<MarketingNavbar isAuthenticated={false} />);

    expect(screen.getByRole("link", { name: "Masuk" }).getAttribute("href"))
      .toBe("/login");
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });
});

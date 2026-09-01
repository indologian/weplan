/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LuxuryMidnightRenderer } from "@/modules/theme/themes/luxury-midnight/renderer";
import type { PublicInvitationDTO } from "@/modules/invitation/types";

describe("Luxury Midnight Theme Renderer", () => {
  const minimalInvitation: PublicInvitationDTO = {
    slug: "test-luxury",
    theme: { rendererKey: "luxury-midnight", designTokens: {}, layoutConfig: {} },
    couple: {
      groom: { name: "Groom Name" },
      bride: { name: "Bride Name" },
    },
    events: [],
    loveStory: [],
    settings: {},
    wishes: [],
    rsvpMode: "open",
<<<<<<< HEAD
    media: [],
    bankAccounts: [],
    invitationId: "test-id",
    isPrivate: false,
=======
    physicalGifts: [],
    media: [],
    bankAccounts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
    status: "draft",
    viewCount: 0,
>>>>>>> cca1586eb4c8e725dd24790e7c34c2415fbd4dc6
  };

  it("renders with empty designTokens and layoutConfig without crashing", () => {
    const { container } = render(
      <LuxuryMidnightRenderer invitation={minimalInvitation} />
    );
    expect(container).toBeTruthy();
  });

  it("renders the root with canonical classes", () => {
    const { container } = render(
      <LuxuryMidnightRenderer invitation={minimalInvitation} />
    );
    const root = container.querySelector(".wedding-theme.luxury-midnight");
    expect(root).not.toBeNull();
  });

  it("renders the Cover section with correct fallback names", () => {
    render(<LuxuryMidnightRenderer invitation={minimalInvitation} />);
    expect(screen.getAllByText("Groom Name").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bride Name").length).toBeGreaterThan(0);
  });

  it("has exactly one H1", () => {
    const { container } = render(
      <LuxuryMidnightRenderer invitation={minimalInvitation} />
    );
    const h1s = container.querySelectorAll("h1");
    expect(h1s.length).toBe(1);
  });
});



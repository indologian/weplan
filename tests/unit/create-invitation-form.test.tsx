/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateInvitationForm } from "@/app/(dashboard)/_components/create-invitation-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

describe("CreateInvitationForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("persists clientRef in sessionStorage and reuses it", () => {
    const { unmount } = render(<CreateInvitationForm createInvitation={vi.fn()} />);
    const storedRef = sessionStorage.getItem("create_invitation_ref");
    expect(storedRef).toBeTruthy();
    
    unmount();
    
    // Remount, should use the same ref
    render(<CreateInvitationForm createInvitation={vi.fn()} />);
    expect(sessionStorage.getItem("create_invitation_ref")).toBe(storedRef);
  });
});


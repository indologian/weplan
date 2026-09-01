import { vi } from "vitest";

vi.mock("next/font/google", () => {
  return {
    Playfair_Display: () => ({ variable: "--font-wedding-display", style: { fontFamily: "mocked" } }),
    Inter: () => ({ variable: "--font-inter", style: { fontFamily: "mocked" } }),
    Jakarta: () => ({ variable: "--font-jakarta", style: { fontFamily: "mocked" } })
  };
});

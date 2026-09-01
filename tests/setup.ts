import { vi } from "vitest";

vi.mock("next/font/google", () => {
  return {
    Playfair_Display: () => ({ variable: "--font-wedding-display", style: { fontFamily: "mocked" } }),
    Plus_Jakarta_Sans: () => ({ variable: "--font-jakarta", style: { fontFamily: "mocked" } })
  };
});

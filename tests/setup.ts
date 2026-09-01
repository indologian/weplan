import { vi } from "vitest";

type FontOptions = {
  variable?: string;
};

const createFontMock = (options?: FontOptions) => ({
  variable: options?.variable ?? "",
  style: { fontFamily: "mocked" },
});

vi.mock("next/font/google", () => {
  return {
    Playfair_Display: createFontMock,
    Inter: createFontMock,
    Plus_Jakarta_Sans: createFontMock,
  };
});

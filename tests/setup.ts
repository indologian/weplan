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
    Bodoni_Moda: createFontMock,
    Montserrat: createFontMock,
  };
});


if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

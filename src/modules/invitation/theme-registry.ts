import { getActiveRendererKeys } from "@/modules/theme/registry";

export function getKnownRendererKeys(): string[] {
  return getActiveRendererKeys();
}

const AUTH_REDIRECT_BASE = "https://auth.weplan.invalid";

export function getSafeAuthRedirect(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return fallback;
  }

  try {
    const base = new URL(AUTH_REDIRECT_BASE);
    const resolved = new URL(value, base);

    if (resolved.origin !== base.origin) {
      return fallback;
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

export function createAuthCallbackUrl(origin: string, redirectTo: string): string {
  const callbackUrl = new URL("/callback", origin);
  callbackUrl.searchParams.set("redirect", getSafeAuthRedirect(redirectTo));
  return callbackUrl.toString();
}

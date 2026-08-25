export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "VERSION_CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_STATE"
  | "RATE_LIMITED"
  | "THEME_LIMIT_CONFLICT"
  | "TEMPORARY_ERROR";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      code: ActionErrorCode;
      error: string;
      serverVersion?: number;
      fieldErrors?: Record<string, string[]>;
    };

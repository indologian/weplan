export type CurrentUserProfile = {
  id: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  authContextVersion: number;
  isBlocked: boolean;
  accountStatus: "active" | "pending_deletion" | "deleting";
};

export type GuestManagementDTO = {
  id: string;
  name: string;
  phone: string | null;
  title: string | null;
  groupName: string | null;
  source: "manual" | "import" | "public_rsvp";
  rsvpStatus: "pending" | "confirmed" | "declined";
  attendance: number;
  wishMessage: string | null;
  wishStatus: "pending" | "approved" | "hidden" | "rejected";
  isWaSent: boolean;
};

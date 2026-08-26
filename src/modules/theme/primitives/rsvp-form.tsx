"use client";

import { useState } from "react";

type Attendance = "confirmed" | "declined";

type Props = {
  guestName?: string;
  isOpen: boolean;
  onSubmit: (data: {
    name: string;
    phone: string;
    attendance: Attendance;
    guestCount: number;
    wishMessage: string;
  }) => Promise<void>;
  className?: string;
};

export function RsvpForm({ guestName, isOpen, onSubmit, className }: Props) {
  const [name, setName] = useState(guestName ?? "");
  const [phone, setPhone] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("confirmed");
  const [guestCount, setGuestCount] = useState(1);
  const [wishMessage, setWishMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await onSubmit({ name, phone, attendance, guestCount, wishMessage });
      setMessage("Terima kasih atas konfirmasi Anda!");
    } catch {
      setMessage("Gagal mengirim. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className={className} aria-label="RSVP">
      <h3>Konfirmasi Kehadiran</h3>
      <form onSubmit={handleSubmit}>
        {!guestName && (
          <label>
            Nama
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        {isOpen && (
          <label>
            Nomor WhatsApp
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
        )}
        <fieldset>
          <legend>Kehadiran</legend>
          <label>
            <input
              type="radio"
              name="attendance"
              value="confirmed"
              checked={attendance === "confirmed"}
              onChange={() => setAttendance("confirmed")}
            />
            Hadir
          </label>
          <label>
            <input
              type="radio"
              name="attendance"
              value="declined"
              checked={attendance === "declined"}
              onChange={() => setAttendance("declined")}
            />
            Tidak Hadir
          </label>
        </fieldset>
        {attendance === "confirmed" && (
          <label>
            Jumlah tamu
            <input
              type="number"
              min={1}
              max={10}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
            />
          </label>
        )}
        <label>
          Ucapan & Doa
          <textarea
            value={wishMessage}
            onChange={(e) => setWishMessage(e.target.value)}
            maxLength={500}
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Mengirim..." : "Kirim"}
        </button>
      </form>
      {message && <p aria-live="polite">{message}</p>}
    </section>
  );
}

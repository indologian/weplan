"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  className?: string;
  qris?: { url: string; width: number | null; height: number | null };
};

export function GiftCard({
  bankName,
  accountNumber,
  accountHolder,
  className,
  qris,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // fallback for in-app browsers
      const input = document.createElement("input");
      input.value = accountNumber;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    }
  };

  return (
    <div className={className}>
      <p>{bankName}</p>
      <p>{accountNumber}</p>
      <p>{accountHolder}</p>
      {qris && (
        <Image
          src={qris.url}
          alt={`Kode QRIS atas nama ${accountHolder}`}
          width={qris.width ?? 600}
          height={qris.height ?? 600}
          sizes="280px"
          style={{ width: "min(100%, 280px)", height: "auto", margin: "1rem auto" }}
        />
      )}
      <button type="button" onClick={handleCopy}>
        {copied ? "Tersalin" : "Salin Nomor"}
      </button>
    </div>
  );
}

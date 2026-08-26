"use client";

import { useState } from "react";

type Props = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  className?: string;
};

export function GiftCard({
  bankName,
  accountNumber,
  accountHolder,
  className,
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
      <button type="button" onClick={handleCopy}>
        {copied ? "Tersalin" : "Salin Nomor"}
      </button>
    </div>
  );
}

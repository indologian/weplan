"use client";

import { useState } from "react";
import { X } from "lucide-react";

type NavigationItem = { id: string; label: string };

export function InvitationNavigation({ items }: { items: NavigationItem[] }) {
  const [visible, setVisible] = useState(true);
  if (!visible || items.length === 0) return null;

  return (
    <nav className="theme-navigation" aria-label="Navigasi undangan">
      <div className="theme-navigation-links">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`}>{item.label}</a>
        ))}
      </div>
      <button type="button" onClick={() => setVisible(false)} aria-label="Tutup navigasi">
        <X aria-hidden="true" size={16} />
      </button>
    </nav>
  );
}

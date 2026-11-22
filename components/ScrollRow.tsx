"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  className: string;
  label: string;
  selectedId: string | null | undefined;
  /** Sits before the items, and stays put when they overflow. */
  lead?: ReactNode;
  /** Sits after the items, and stays put when they overflow. */
  action: ReactNode;
  children: ReactNode;
};

export function ScrollRow({ className, label, selectedId, lead, action, children }: Props) {
  const items = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    items.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  return (
    <nav className={`row ${className}`} aria-label={label}>
      {lead}
      <div className="items" ref={items}>
        {children}
      </div>
      {action}
    </nav>
  );
}

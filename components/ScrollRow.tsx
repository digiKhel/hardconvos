"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  className: string;
  label: string;
  selectedId: string | null | undefined;
  /** Sits after the items, and stays put when they overflow. */
  action: ReactNode;
  children: ReactNode;
};

export function ScrollRow({ className, label, selectedId, action, children }: Props) {
  const items = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    items.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedId]);

  return (
    <nav className={`row ${className}`} aria-label={label}>
      <div className="items" ref={items}>
        {children}
      </div>
      {action}
    </nav>
  );
}

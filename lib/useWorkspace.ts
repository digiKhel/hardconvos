"use client";

import { useEffect, useState } from "react";
import { emptyWorkspace, type Workspace } from "./workspace";

const STORAGE_KEY = "hardconvos:v1";

/** Workspace state, kept in this browser only. */
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (Array.isArray(saved?.people)) setWorkspace(saved);
    } catch {
      // Storage is blocked or unreadable: start empty.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Storage is blocked or full: keep working in memory.
    }
  }, [workspace, ready]);

  return { workspace, setWorkspace, ready };
}

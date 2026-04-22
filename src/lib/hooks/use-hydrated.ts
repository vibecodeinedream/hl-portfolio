"use client";
import { useEffect, useState } from "react";

// Returns false on SSR + initial client render, true after hydration.
// Prevents hydration mismatches when reading persisted localStorage state.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

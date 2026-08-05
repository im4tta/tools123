"use client";

import { useEffect, useState } from "react";

/** Read Universal Input's hand-off value without coupling tools to routing. */
export function useQueryInput() {
  const [input, setInput] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("input");
    if (!value) return;
    const timer = window.setTimeout(() => setInput(value), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return input;
}

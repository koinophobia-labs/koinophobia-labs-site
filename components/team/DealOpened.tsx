"use client";
import { useEffect } from "react";
export function DealOpened({ code }: { code: string }) {
  useEffect(() => {
    void fetch(`/go/${code}/opened`, { method: "POST", credentials: "omit" });
  }, [code]);
  return null;
}

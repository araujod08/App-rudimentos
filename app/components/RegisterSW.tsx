"use client";
import { useEffect } from "react";
import { initSync } from "../lib/sync";

export default function RegisterSW() {
  useEffect(() => {
    initSync();
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

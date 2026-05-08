"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchSheet, type SheetData } from "@/lib/gviz";

const REFRESH_MS = 30_000;

export function useSheet() {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await fetchSheet();
      setData(d);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(() => load(true), REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  return { data, loading, error, refresh: () => load(false) };
}

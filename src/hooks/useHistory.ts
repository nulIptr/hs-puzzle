import React, { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from '../types';

const STORAGE_KEY = 'hs-puzzle-history';
const MAX_ENTRIES = 50;

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.finishedAt === 'number' &&
    typeof v.gameMode === 'string' &&
    typeof v.score === 'number' &&
    typeof v.totalHints === 'number' &&
    typeof v.totalGuesses === 'number' &&
    Array.isArray(v.rounds)
  );
};

const loadHistory = (): HistoryEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
};

const persistHistory = (entries: HistoryEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / serialization failures
  }
};

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  useEffect(() => {
    persistHistory(history);
  }, [history]);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev];
      if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
};

// 排行榜 API 客户端
// - 走同源 /api/leaderboard
// - 版本号从 package.json 注入 (Rsbuild define), 默认 v1.0.0
// - dev 模式 (rsbuild dev server) 不提供 Pages Functions, 自动回退到 localStorage mock

import type { GameMode, RoundResult } from '../types';

export const GAME_VERSION = 'v1.0.0';

export interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  version: string;
  gameMode: GameMode;
  totalHints: number;
  totalGuesses: number;
  createdAt: number;
}

export interface SubmitRound {
  cardId: number;
  hintCount: number;
  guessCount: number;
  score: number;
}

export interface FetchOptions {
  version?: string;
  mode: GameMode;
  limit?: number;
  signal?: AbortSignal;
}

export interface SubmitOptions {
  username: string;
  score: number;
  version?: string;
  gameMode: GameMode;
  totalHints: number;
  totalGuesses: number;
  rounds: SubmitRound[];
}

export interface SubmitResult {
  id: number;
  rank: number;
}

const apiBase = (): string => '/api/leaderboard';

// dev 模式开关: Rsbuild 注入 process.env.NODE_ENV
const isDev = (): boolean => process.env.NODE_ENV !== 'production';

// ===== dev mock 持久化 (localStorage) =====
const MOCK_LS_KEY = 'hs-puzzle.dev-leaderboard';

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const loadMockEntries = (): LeaderboardEntry[] => {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(MOCK_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const saveMockEntries = (entries: LeaderboardEntry[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(MOCK_LS_KEY, JSON.stringify(entries));
};

export const clearMockLeaderboard = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(MOCK_LS_KEY);
};

const seedMockEntries = (): LeaderboardEntry[] => {
  // 首次访问写入一批示例数据, 避免 dev 看到空榜单
  const now = Date.now();
  const day = 86_400_000;
  const seed: LeaderboardEntry[] = [
    { id: 1,  username: '炉石传说',     score: 4880, version: GAME_VERSION, gameMode: 'standard', totalHints:  4, totalGuesses:  6, createdAt: now - 3 * day },
    { id: 2,  username: 'WildMaster',  score: 4420, version: GAME_VERSION, gameMode: 'standard', totalHints:  9, totalGuesses:  9, createdAt: now - 2 * day },
    { id: 3,  username: '标准狂野双修', score: 4100, version: GAME_VERSION, gameMode: 'standard', totalHints: 12, totalGuesses: 11, createdAt: now - 1 * day },
    { id: 4,  username: '萌新卡牌',     score: 3700, version: GAME_VERSION, gameMode: 'standard', totalHints: 14, totalGuesses: 13, createdAt: now - 6 * 3600_000 },
    { id: 5,  username: '炉石酒馆',     score: 3200, version: GAME_VERSION, gameMode: 'standard', totalHints: 18, totalGuesses: 15, createdAt: now - 3 * 3600_000 },
    { id: 6,  username: 'StandardPilot',score: 2500, version: GAME_VERSION, gameMode: 'standard', totalHints: 22, totalGuesses: 17, createdAt: now - 1 * 3600_000 },
    { id: 7,  username: '狂野老兵',     score: 4700, version: GAME_VERSION, gameMode: 'wild',     totalHints:  5, totalGuesses:  8, createdAt: now - 2 * day },
    { id: 8,  username: 'WildWalker',   score: 3950, version: GAME_VERSION, gameMode: 'wild',     totalHints: 11, totalGuesses: 12, createdAt: now - 1 * day },
    { id: 9,  username: '炸服工程师',   score: 3300, version: GAME_VERSION, gameMode: 'wild',     totalHints: 16, totalGuesses: 14, createdAt: now - 4 * 3600_000 },
    { id: 10, username: '随机玩家',     score: 1800, version: GAME_VERSION, gameMode: 'wild',     totalHints: 25, totalGuesses: 19, createdAt: now - 30 * 60_000 },
  ];
  saveMockEntries(seed);
  return seed;
};

const ensureMockSeeded = (): LeaderboardEntry[] => {
  const existing = loadMockEntries();
  if (existing.length > 0) return existing;
  return seedMockEntries();
};

const mockFetch = (opts: FetchOptions): LeaderboardEntry[] => {
  const all = ensureMockSeeded();
  const version = opts.version ?? GAME_VERSION;
  const limit = opts.limit ?? 20;
  return all
    .filter((e) => e.version === version && e.gameMode === opts.mode)
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
    .slice(0, limit);
};

const mockSubmit = (opts: SubmitOptions): SubmitResult => {
  const all = ensureMockSeeded();
  const id = all.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  const createdAt = Date.now();
  const entry: LeaderboardEntry = {
    id,
    username: opts.username,
    score: opts.score,
    version: opts.version ?? GAME_VERSION,
    gameMode: opts.gameMode,
    totalHints: opts.totalHints,
    totalGuesses: opts.totalGuesses,
    createdAt,
  };
  all.push(entry);
  saveMockEntries(all);
  const rank = mockFetch({ mode: opts.gameMode, version: opts.version ?? GAME_VERSION, limit: 9999 })
    .findIndex((e) => e.id === id);
  return { id, rank: rank >= 0 ? rank + 1 : 0 };
};

export async function fetchLeaderboard(opts: FetchOptions): Promise<LeaderboardEntry[]> {
  if (isDev()) {
    return mockFetch(opts);
  }

  const params = new URLSearchParams({
    version: opts.version ?? GAME_VERSION,
    mode: opts.mode,
  });
  if (opts.limit) params.set('limit', String(opts.limit));

  const res = await fetch(`${apiBase()}?${params.toString()}`, {
    method: 'GET',
    signal: opts.signal,
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    entries?: LeaderboardEntry[];
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.entries ?? [];
}

export async function submitScore(opts: SubmitOptions): Promise<SubmitResult> {
  if (isDev()) {
    return mockSubmit(opts);
  }

  const res = await fetch(apiBase(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: opts.username,
      score: opts.score,
      version: opts.version ?? GAME_VERSION,
      gameMode: opts.gameMode,
      totalHints: opts.totalHints,
      totalGuesses: opts.totalGuesses,
      rounds: opts.rounds,
      createdAt: Date.now(),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: number;
    rank?: number;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return { id: data.id ?? 0, rank: data.rank ?? 0 };
}

// 把 useGameState 里的 RoundResult 转成可上传格式
export const toSubmitRounds = (rounds: RoundResult[]): SubmitRound[] =>
  rounds.map((r) => ({
    cardId: r.card.id,
    hintCount: r.hintCount,
    guessCount: r.guessCount,
    score: Math.max(0, 1000 - r.hintCount * 80 - r.guessCount * 50),
  }));

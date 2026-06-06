// 排行榜 API 客户端
// - 走同源 /api/leaderboard
// - 版本号从 package.json 注入 (Rsbuild define), 默认 v1.0.0

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

const apiBase = (): string => {
  // Pages Functions 与静态资源同源, 直接走 /api 即可
  return '/api/leaderboard';
};

export async function fetchLeaderboard(opts: FetchOptions): Promise<LeaderboardEntry[]> {
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

export interface SubmitResult {
  id: number;
  rank: number;
}

export async function submitScore(opts: SubmitOptions): Promise<SubmitResult> {
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

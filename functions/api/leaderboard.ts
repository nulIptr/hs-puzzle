// Cloudflare Pages Function: /api/leaderboard
//
// GET  /api/leaderboard?version=<v>&mode=<standard|wild>&limit=<n>
//   -> { ok, entries: [{ id, username, score, gameMode, totalHints, totalGuesses, createdAt }] }
//
// POST /api/leaderboard
//   body: { username, score, version, gameMode, totalHints, totalGuesses, rounds: [...] }
//   -> { ok, id, rank }
//
// 数据校验策略:
//   - 用户名:  1~20 字符,去除前后空格,禁止控制字符
//   - 分数:    0~5000,服务端按 rounds 重新计算,允许 ±10 容差
//   - 轮数:    必须为 5
//   - 提示/猜测: 0~7, 与 rounds 累计一致
//   - 版本:    必填, 长度 1~20
//   - 模式:    standard | wild
//
// 防滥用:
//   - 单条记录大小限制 (rounds JSON < 4KB)
//   - 同一 username 在 5 秒内只能上传一次

/// <reference types="@cloudflare/workers-types" />

interface Env {
  LEADERBOARD_DB: D1Database;
}

interface RoundPayload {
  cardId: number;
  hintCount: number;
  guessCount: number;
  score: number;
}

interface SubmitBody {
  username: string;
  score: number;
  version: string;
  gameMode: string;
  totalHints: number;
  totalGuesses: number;
  rounds: RoundPayload[];
}

interface LeaderboardRow {
  id: number;
  username: string;
  score: number;
  version: string;
  game_mode: string;
  total_hints: number;
  total_guesses: number;
  created_at: number;
}

const MAX_USERNAME_LEN = 20;
const MIN_USERNAME_LEN = 1;
const MAX_VERSION_LEN = 20;
const ROUNDS_PER_GAME = 5;
const MAX_SCORE_PER_ROUND = 1000;
const MAX_TOTAL_SCORE = ROUNDS_PER_GAME * MAX_SCORE_PER_ROUND; // 5000
const HINT_PENALTY = 80;
const GUESS_PENALTY = 50;
const SCORE_TOLERANCE = 10; // 允许 ±10 容差 (与 GAME_VERSION 升级时的微调兼容)
const RATE_LIMIT_WINDOW_MS = 5_000;
const MAX_PAYLOAD_BYTES = 4096;

// 控制字符过滤 (保留中文/英文/数字/常见符号/emoji)
const stripControlChars = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, '');

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // 排行榜查询可短期缓存,上传永远不缓存
      'cache-control': 'no-store',
    },
  });

const error = (message: string, status = 400, extra: Record<string, unknown> = {}): Response =>
  json({ ok: false, error: message, ...extra }, status);

const computeRoundScore = (hintCount: number, guessCount: number): number => {
  const raw = 1000 - hintCount * HINT_PENALTY - guessCount * GUESS_PENALTY;
  return Math.max(0, raw);
};

const validateUsername = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const cleaned = stripControlChars(raw).trim();
  if (cleaned.length < MIN_USERNAME_LEN || cleaned.length > MAX_USERNAME_LEN) return null;
  return cleaned;
};

const validateVersion = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const cleaned = stripControlChars(raw).trim();
  if (cleaned.length < 1 || cleaned.length > MAX_VERSION_LEN) return null;
  return cleaned;
};

const validateMode = (raw: unknown): 'standard' | 'wild' | null => {
  if (raw === 'standard' || raw === 'wild') return raw;
  return null;
};

const validateRounds = (raw: unknown): RoundPayload[] | null => {
  if (!Array.isArray(raw) || raw.length !== ROUNDS_PER_GAME) return null;
  const out: RoundPayload[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null;
    const obj = r as Record<string, unknown>;
    const cardId = Number(obj.cardId);
    const hintCount = Number(obj.hintCount);
    const guessCount = Number(obj.guessCount);
    if (!Number.isFinite(cardId) || !Number.isInteger(cardId) || cardId <= 0) return null;
    if (!Number.isFinite(hintCount) || !Number.isInteger(hintCount) || hintCount < 0 || hintCount > 7) {
      return null;
    }
    if (!Number.isFinite(guessCount) || !Number.isInteger(guessCount) || guessCount < 1 || guessCount > 50) {
      return null;
    }
    out.push({ cardId, hintCount, guessCount, score: computeRoundScore(hintCount, guessCount) });
  }
  return out;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const version = validateVersion(url.searchParams.get('version'));
  const mode = validateMode(url.searchParams.get('mode'));
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get('limit') ?? 20) | 0)
  );

  if (!version) return error('version 参数无效', 400);
  if (!mode) return error('mode 参数无效 (standard | wild)', 400);

  const db = context.env.LEADERBOARD_DB;
  if (!db) return error('排行榜服务未配置 (D1 绑定缺失)', 503);

  try {
    const result = await db
      .prepare(
        `SELECT id, username, score, version, game_mode, total_hints, total_guesses, created_at
         FROM leaderboard
         WHERE version = ? AND game_mode = ?
         ORDER BY score DESC, created_at ASC
         LIMIT ?`
      )
      .bind(version, mode, limit)
      .all<LeaderboardRow>();

    const entries = (result.results ?? []).map((row) => ({
      id: row.id,
      username: row.username,
      score: row.score,
      version: row.version,
      gameMode: row.game_mode,
      totalHints: row.total_hints,
      totalGuesses: row.total_guesses,
      createdAt: row.created_at,
    }));

    return json({ ok: true, entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`查询失败: ${msg}`, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.LEADERBOARD_DB;
  if (!db) return error('排行榜服务未配置 (D1 绑定缺失)', 503);

  // 1) 限流
  const ip = context.request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rateKey = `rl:${ip}`;
  const last = await db
    .prepare('SELECT created_at FROM leaderboard WHERE username = ? ORDER BY created_at DESC LIMIT 1')
    .bind(rateKey)
    .first<{ created_at: number }>();
  const now = Date.now();
  if (last && now - last.created_at < RATE_LIMIT_WINDOW_MS) {
    return error('请求过于频繁, 请稍后再试', 429);
  }

  // 2) 解析 body
  let body: SubmitBody;
  try {
    const raw = await context.request.text();
    if (raw.length > MAX_PAYLOAD_BYTES) return error('请求体过大', 413);
    body = JSON.parse(raw) as SubmitBody;
  } catch {
    return error('请求体不是合法 JSON', 400);
  }

  // 3) 字段校验
  const username = validateUsername(body.username);
  if (!username) return error(`用户名长度需在 ${MIN_USERNAME_LEN}~${MAX_USERNAME_LEN} 之间`, 400);

  const version = validateVersion(body.version);
  if (!version) return error('version 无效', 400);

  const gameMode = validateMode(body.gameMode);
  if (!gameMode) return error('gameMode 必须为 standard 或 wild', 400);

  const rounds = validateRounds(body.rounds);
  if (!rounds) return error(`rounds 必须为 ${ROUNDS_PER_GAME} 项, 且每项字段合法`, 400);

  // 4) 服务端二次计算分数
  const expectedTotal = rounds.reduce((sum, r) => sum + r.score, 0);
  const reportedScore = Number(body.score);
  if (!Number.isFinite(reportedScore) || reportedScore < 0 || reportedScore > MAX_TOTAL_SCORE) {
    return error(`score 必须在 0~${MAX_TOTAL_SCORE} 之间`, 400);
  }
  if (Math.abs(reportedScore - expectedTotal) > SCORE_TOLERANCE) {
    return error(
      `score 与轮次数据不一致 (期望 ${expectedTotal}, 实际 ${reportedScore}, 容差 ${SCORE_TOLERANCE})`,
      400
    );
  }

  const reportedHints = Number(body.totalHints);
  const reportedGuesses = Number(body.totalGuesses);
  if (!Number.isInteger(reportedHints) || reportedHints < 0 || reportedHints > ROUNDS_PER_GAME * 7) {
    return error('totalHints 非法', 400);
  }
  if (
    !Number.isInteger(reportedGuesses) ||
    reportedGuesses < ROUNDS_PER_GAME ||
    reportedGuesses > ROUNDS_PER_GAME * 50
  ) {
    return error('totalGuesses 非法', 400);
  }
  const sumHints = rounds.reduce((s, r) => s + r.hintCount, 0);
  const sumGuesses = rounds.reduce((s, r) => s + r.guessCount, 0);
  if (sumHints !== reportedHints || sumGuesses !== reportedGuesses) {
    return error('totalHints/totalGuesses 与轮次累计不一致', 400);
  }

  const createdAt =
    Number.isFinite(Number(body.createdAt)) && Number(body.createdAt) > 0
      ? Number(body.createdAt)
      : now;

  // 5) 写入 + 计算排名
  try {
    const insert = await db
      .prepare(
        `INSERT INTO leaderboard
           (username, score, version, game_mode, total_hints, total_guesses, rounds_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        username,
        reportedScore,
        version,
        gameMode,
        reportedHints,
        reportedGuesses,
        JSON.stringify(rounds),
        createdAt
      )
      .run();

    const id = Number(insert.meta?.last_row_id ?? 0);

    // 排名: 严格大于本分数的数量 + 1
    const rankRow = await db
      .prepare(
        `SELECT COUNT(*) AS higher
         FROM leaderboard
         WHERE version = ? AND game_mode = ? AND score > ?`
      )
      .bind(version, gameMode, reportedScore)
      .first<{ higher: number }>();

    return json({ ok: true, id, rank: (rankRow?.higher ?? 0) + 1, serverTime: now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return error(`写入失败: ${msg}`, 500);
  }
};

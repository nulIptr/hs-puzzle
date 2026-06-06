-- HS Puzzle 排行榜表结构
-- 执行命令:  wrangler d1 execute hs-puzzle-leaderboard --file=db/schema.sql --remote
-- 本地开发:  wrangler d1 execute hs-puzzle-leaderboard --file=db/schema.sql --local

CREATE TABLE IF NOT EXISTS leaderboard (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 用户名 (1~20 字符,中文/英文/数字/下划线,前端已 trim + 校验)
  username        TEXT    NOT NULL,
  -- 本局总得分 (0~5000,服务端二次校验)
  score           INTEGER NOT NULL,
  -- 游戏版本, 用于按版本隔离排行榜 (默认 v1.0.0)
  version         TEXT    NOT NULL,
  -- 游戏模式: standard | wild
  game_mode       TEXT    NOT NULL,
  -- 5 轮总提示数
  total_hints     INTEGER NOT NULL,
  -- 5 轮总猜测数
  total_guesses   INTEGER NOT NULL,
  -- 完整轮次 JSON: [{ cardId, hintCount, guessCount, score }, ...]
  rounds_json     TEXT    NOT NULL,
  -- 上传时间 (ms, 客户端生成,服务端用作 tie-break)
  created_at      INTEGER NOT NULL
);

-- 按版本 + 模式 + 分数降序 + 时间升序建立复合索引,加速 Top20 查询与排名计算
CREATE INDEX IF NOT EXISTS idx_leaderboard_version_mode_score
  ON leaderboard (version, game_mode, score DESC, created_at ASC);

# AGENTS.md

You are an expert in JavaScript, Rsbuild, and web application development. You write maintainable, performant, and accessible code.

## Commands

- `bun run dev` - Start the dev server
- `bun run build` - Build the app for production
- `bun run preview` - Preview the production build locally
- `npx wrangler pages deploy ./dist` - Deploy the production build to Cloudflare Pages
## Docs

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt



# HS Puzzle · 炉石猜卡小游戏

> 一款运行在浏览器中的单人猜卡游戏：每局 5 轮猜卡，目标是用最少的提示和猜测锁定一张"谜底"随从。

## 1. 项目概览

| 项目 | 详情 |
| --- | --- |
| 名称 | `hs-puzzle` |
| 版本 | 1.0.0 |
| 类型 | 单页 Web 应用（SPA） |
| 包管理 | Bun（脚本：`bun run dev` / `bun run build` / `bun run preview`） |
| 构建工具 | Rsbuild 2 + Rspack |
| UI 框架 | React 19 + TypeScript 6 |
| 持久化 | `localStorage`（历史通关记录） |
| 主题 | 仿《炉石传说》UI 风格（深棕底色 + 金色高亮） |

游戏数据完全内置在 `src/data/` 目录的 `MINION_CARDS` 中（随从卡牌元数据），无需任何后端服务。

## 2. 核心玩法

- **局 = 5 轮**：每局游戏固定 5 轮，每轮从当前模式的随从池中随机抽 1 张作为谜底。
- **每轮 7 类提示**：费用、攻击力、生命值、职业、种族、卡牌系列、稀有度；每类只揭示一次。
- **每轮可无限次猜测**：点错会显示与谜底的匹配度（X/7）；同一张卡重复猜测会被拦截并提示"已排除"，不计入猜测次数。
- **猜对即正反馈**：先展示 1.8 秒庆祝面板（卡名 + 提示数/猜测数/本轮得分），自动进入下一轮。
- **放弃本局**：弹窗二次确认后整局 5 轮全部作废，最终得分记为 0。

## 3. 计分公式

```
轮次得分 = max(0, 1000 - 提示数 × 80 - 猜测数 × 50)
最终得分 = 5 轮得分累加（放弃时为 0）
```

| 总分区间 | 评级 |
| --- | --- |
| ≥ 4500 | S · 炉石传说 |
| ≥ 3500 | A · 大师级 |
| ≥ 2500 | B · 熟练 |
| ≥ 1500 | C · 一般 |
| 其余 | D · 再接再厉 |

## 4. 模式

- **标准**：只使用当前标准系列的随从。
- **狂野**：使用全部随从。
- 切换模式需二次确认，避免误操作丢失进度。

## 5. 关键交互细节

- **重复猜测拦截**：`makeGuess` 通过 `guesses.some(g => g.card.id === card.id)` 检测重复，已排除的卡牌以红色角标 + 半透明显示，且不再计入猜测次数。
- **实时历史**：游戏内任何动作都会立即写入本局状态；"📜 历史"按钮随时打开模态框查看"本局进行中"页。
- **谜底保护**：本局进行中的"局数回顾"对未揭晓的当前轮以 `???` 渲染，**不暴露目标卡牌名**，避免剧透。
- **轮切换重置筛选**：自动进入下一轮时自动清空费用/攻击/血量/类型/稀有度等筛选条件。
- **Strict Mode 兼容**：`finalizeRound` 内的所有 `setState` 都放在 `setRoundResults` 的 updater 之外，规避 React 18+ StrictMode 下 updater 双调用导致的 `setCurrentRound` 翻倍。
- **首次访问引导**：`useEffect` 读取 `localStorage['hs-puzzle.rules.seen']`，未见过时自动弹出 `RulesModal`；关闭后写入标记。
- **调试面板**：开发模式下 `window.hsDebug.help()` 暴露游戏状态探针。

## 6. 目录结构

```
hs-puzzle/
├── AGENTS.md                  # Agent 工作约定（命令/文档）
├── PROJECT.md                 # 本文件：项目描述 + 设计文档
├── package.json
├── rsbuild.config.ts          # Rsbuild 配置（React 插件）
├── tsconfig.json
└── src/
    ├── index.tsx              # 应用入口
    ├── App.tsx
    ├── types/                 # 共享类型定义
    │   └── index.ts
    ├── data/                  # 卡牌元数据 + 模式筛选
    │   ├── index.ts
    │   └── metadata.ts
    ├── hooks/
    │   ├── useGameState.ts    # 核心：游戏状态机（回合/分数/放弃）
    │   ├── useFilteredCards.ts
    │   └── useHistory.ts      # localStorage 历史记录
    ├── lib/
    │   ├── username.ts        # 排行榜用户名 localStorage 工具
    │   └── leaderboardApi.ts  # 排行榜 fetch/submit 封装 + GAME_VERSION
    ├── components/
    │   ├── GameBoard.tsx      # 顶层游戏界面
    │   ├── CardSelector.tsx   # 候选卡牌网格
    │   ├── CardItem.tsx       # 单张卡牌渲染
    │   ├── HintPanel.tsx      # 7 类提示按钮 + 已揭示面板
    │   ├── GuessHistory.tsx   # 实时猜测历史
    │   ├── RulesModal.tsx     # 游戏规则弹窗（首启自动弹出）
    │   ├── HistoryModal.tsx   # 历史记录 + 本局实时数据
    │   ├── GameOverModal.tsx  # 结算界面 + 排行榜上传区
    │   └── LeaderboardPage.tsx # 独立排行榜页（/leaderboard）
├── functions/                 # Cloudflare Pages Functions（同源部署）
│   └── api/
│       └── leaderboard.ts     # GET 排行榜 / POST 上传分数（含服务端二次校验）
└── db/
    └── schema.sql             # D1 排行榜表结构（wrangler d1 execute 同步）
```

## 7. 状态机（`useGameState`）

| 状态 | 类型 | 说明 |
| --- | --- | --- |
| `targets` | `Card[]` | 当前局随机出的 5 张谜底 |
| `currentRound` | `number` | 当前轮次索引（0~4） |
| `hints` | `Hint[]` | 当前轮已揭示的提示 |
| `guesses` | `GuessResult[]` | 当前轮已猜测记录 |
| `roundResults` | `RoundResult[]` | 已完成的轮次得分 |
| `gameOver` | `boolean` | 是否已结束 |
| `abandoned` | `boolean` | 是否放弃 |
| `finalScore` | `number` | 最终得分 |
| `solved` | `SolvedCelebration \| null` | 猜对庆祝状态（含倒计时 1.8s） |
| `feedback` | `Feedback \| null` | toast 反馈（成功/信息/错误） |

## 8. 事件流

```
[startNewGame]  → 重置状态 + 抽 5 张卡
        ↓
[getHint]  → 揭示当前轮下一类提示（不可重复）
[makeGuess] → 猜对 → setSolved  → 1.8s 后 finalizeRound
          → 猜错 → 记录 + 提示"X/7"
          → 重复 → 提示"已排除"，不计数
[abandonGame] → 二次确认弹窗 → 整局 finalScore=0 + gameOver=true
[finalizeRound]  → 计算本轮得分 → 累加 → 下一轮 / 结算
[gameOver=true]  → GameOverModal 弹出 + 历史入栈
```

## 9. 玩家面向的"游戏规则"摘要

> 完整版与插图见应用顶部 `📖 规则` 按钮（首次进入会自动弹出）。

1. **5 轮猜卡**：每轮 1 张谜底，5 轮为一局。
2. **7 类提示**：每轮每类只能揭示一次，揭示后该维度变灰。
3. **任意次猜测**：猜错显示匹配度 `X/7`；重复猜测被拦截。
4. **猜对庆祝**：1.8 秒后自动进入下一轮。
5. **得分**：每轮满分 1000，每用 1 个提示 −80，每猜 1 次 −50，最低 0；5 轮累加 = 总分。
6. **放弃**：整局作废，分数记 0，不可撤销。
7. **模式**：标准 / 狂野；切换需确认。
8. **历史**：本局动作实时可见，过往记录存于 localStorage。
9. **排行榜**：仅「正常结束」（未放弃）的局可上传，绑定 `localStorage` 用户名（1~20 字符）；上传后跳转到 `/leaderboard` 查看 Top 20。

## 10. 排行榜（D1）

- **数据落地**：Cloudflare D1（SQLite），绑定名 `LEADERBOARD_DB`，表名 `leaderboard`，schema 见 `db/schema.sql`。
- **API**：同源 `Pages Functions`：
  - `GET  /api/leaderboard?version=<v>&mode=<standard|wild>&limit=20`
  - `POST /api/leaderboard` body `{ username, score, version, gameMode, totalHints, totalGuesses, rounds: [{ cardId, hintCount, guessCount, score }] }`
- **校验**：服务端按 `rounds` 重新计算总分（容差 ±10），任何字段不一致直接 400；同一 IP 5 秒内只接受一次写入。
- **版本隔离**：`version` 字段（前端常量 `GAME_VERSION`）写入每条记录；查询时必须带 version 才能上榜，默认 `v1.0.0`。
- **路由**：`/` 游戏页、`/leaderboard` 排行榜页；未知路径回退到游戏页（SPA 兜底由 `public/_redirects` 保证）。
- **首次部署（仅一次）**：
  1. `pwsh scripts/deploy-cf.ps1 -Action d1:create` → 拿到 `database_id` 填到 `wrangler.jsonc` 的 `d1_databases[0].database_id`。
  2. `pwsh scripts/deploy-cf.ps1 -Action d1:migrate` → 把 `db/schema.sql` 同步到远程 D1。
  3. `pwsh scripts/deploy-cf.ps1 -Action deploy` → 部署静态资源 + Pages Functions。
- **未配置 D1 时**：API 返回 503，前端在错误提示中显示「排行榜服务未配置」。

## 11. 本地开发：排行榜

`bun run dev` 启动的是 Rsbuild 静态服务器，**不包含** Cloudflare Pages Functions，因此 `/api/leaderboard` 会 404。本项目提供两条本地路径，按需选用：

### 方案 A · Mock fallback（零配置，推荐日常联调）

- `src/lib/leaderboardApi.ts` 在 `process.env.NODE_ENV !== 'production'` 时直接走 localStorage mock，**不发起任何网络请求**。
- 首次访问会自动植入 10 条示例数据（key：`hs-puzzle.dev-leaderboard`），可在排行榜页右上角点 `♻️ 重置 mock` 清空并重新植入。
- 排行榜页标题旁会出现 `DEV · mock` 徽标，build/preview 走真实 Pages Functions。
- 适合：UI 联调、动画/响应式调试、不需要后端的纯前端迭代。

### 方案 B · wrangler pages dev + 本地 D1（端到端验证）

- 完整复刻 Cloudflare Pages Functions + D1 行为，推荐在动排行榜 API/Schema 时使用。
- 前置：`npm i -g wrangler`（或 `bunx wrangler@latest` 临时使用）。
- 步骤：

  ```pwsh
  # 1) 构建静态产物
  bun run build

  # 2) 首次创建本地 D1 schema（只需要跑一次）
  bunx wrangler d1 execute hs-puzzle-leaderboard --file=db/schema.sql --local

  # 3) 用 wrangler 本地服务器托管 dist/ + functions/，D1 绑定为 LEADERBOARD_DB
  bunx wrangler pages dev dist --d1=LEADERBOARD_DB=hs-puzzle-leaderboard --port 5173
  ```

- 浏览器打开 `http://localhost:5173`，打开 DevTools Network 可看到真实的 `/api/leaderboard` 请求。
- 需要造数据时：

  ```pwsh
  # 写入示例数据
  bunx wrangler d1 execute hs-puzzle-leaderboard --local --command "INSERT INTO leaderboard (username, score, version, game_mode, total_hints, total_guesses, rounds_json, created_at) VALUES ('TestUser', 4200, 'v1.0.0', 'standard', 10, 10, '[]', $(Get-Date -UFormat %s)000)"
  # 查询本地榜单
  bunx wrangler d1 execute hs-puzzle-leaderboard --local --command "SELECT username, score, game_mode FROM leaderboard ORDER BY score DESC LIMIT 20"
  ```

- 注：wrangler 本地 D1 数据存放在 `.wrangler/state/v3/d1/` 下，删除可重置；与远程 D1 互不影响。


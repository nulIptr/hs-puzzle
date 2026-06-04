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
    └── components/
        ├── GameBoard.tsx      # 顶层游戏界面
        ├── CardSelector.tsx   # 候选卡牌网格
        ├── CardItem.tsx       # 单张卡牌渲染
        ├── HintPanel.tsx      # 7 类提示按钮 + 已揭示面板
        ├── GuessHistory.tsx   # 实时猜测历史
        ├── RulesModal.tsx     # 游戏规则弹窗（首启自动弹出）
        ├── HistoryModal.tsx   # 历史记录 + 本局实时数据
        └── GameOverModal.tsx  # 结算界面
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

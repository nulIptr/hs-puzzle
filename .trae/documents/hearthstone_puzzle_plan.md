
# 炉石传说猜卡牌游戏实现计划

## 1. 仓库分析结论

- 项目是一个基于 React + Rsbuild 的前端项目
- 已获取到完整的炉石传说卡牌数据：`hs_cards_complete.json`、`hs_metadata.json`
- 技术栈：React 19, TypeScript, Rsbuild

## 2. 游戏核心逻辑

### 2.1 游戏规则
- 从随从卡牌（card_type_id=4）中随机选出目标卡牌
- 最多 5 条提示，最多 6 次猜测机会
- 每次猜测后给出符合几条元数据的反馈
- 右侧提供卡牌过滤器，帮助缩小范围

### 2.2 元数据属性用于比较
- `mana_cost`：费用（精确比较）
- `attack`：攻击力（精确比较）
- `health`：生命值（精确比较）
- `class_id`：职业（精确比较）
- `minion_type_id`：种族（精确比较，0=无）
- `card_set_id`：卡牌系列（精确比较）
- `rarity_id`：稀有度（精确比较）
- `keyword_ids`：关键词（至少有一个相同即符合）

### 2.3 提示机制
- 点击"获取提示"按钮消耗一次提示机会
- 从剩余未揭示的属性中随机选择一个给出确定值
- 例如："职业是：牧师"

## 3. 实现步骤

### 3.1 数据预处理
- 从 `hs_cards_complete.json` 中筛选出随从卡牌（card_type_id=4）
- 从卡牌数据中提取并建立完整的元数据映射（id → 名称），用于显示
- 将元数据映射和筛选后的随从卡牌保存为静态文件或内联到代码中

### 3.2 类型定义
- 定义 Card、MetadataMap、GameState、GuessResult 等 TypeScript 类型

### 3.3 核心组件
| 组件 | 功能 | 文件 |
|------|------|------|
| App | 主应用容器 | `src/App.tsx` |
| GameBoard | 游戏主界面 | `src/components/GameBoard.tsx` |
| CardSelector | 右侧卡牌选择区 + 过滤器 | `src/components/CardSelector.tsx` |
| CardList | 可选择的卡牌网格 | `src/components/CardList.tsx` |
| CardFilter | 元数据过滤器 | `src/components/CardFilter.tsx` |
| CardItem | 单张卡牌显示 | `src/components/CardItem.tsx` |
| GuessHistory | 猜测历史记录 | `src/components/GuessHistory.tsx` |
| HintPanel | 提示面板 | `src/components/HintPanel.tsx` |
| GameOverModal | 游戏结束弹窗 | `src/components/GameOverModal.tsx` |

### 3.4 游戏逻辑 Hook
- `useGameState`：管理游戏状态（目标卡牌、剩余提示、剩余猜测、提示列表、猜测历史）
- `useFilteredCards`：管理过滤器状态和筛选结果

### 3.5 UI 布局
- **左侧**：游戏状态面板（剩余提示/尝试、提示列表、猜测历史）
- **中间**：猜测和提示区域
- **右侧**：卡牌选择和过滤器

### 3.6 文件结构
```
src/
├── data/
│   ├── index.ts           # 导出处理后的卡牌数据和元数据
│   └── metadata.ts        # 元数据映射（手动补充名称）
├── types/
│   └── index.ts           # 类型定义
├── hooks/
│   ├── useGameState.ts
│   └── useFilteredCards.ts
├── components/
│   ├── GameBoard.tsx
│   ├── CardSelector.tsx
│   ├── CardList.tsx
│   ├── CardFilter.tsx
│   ├── CardItem.tsx
│   ├── GuessHistory.tsx
│   ├── HintPanel.tsx
│   └── GameOverModal.tsx
├── App.tsx
├── App.css
└── main.tsx
```

## 4. 潜在问题与处理

| 问题 | 处理方案 |
|------|----------|
| 元数据没有名称（只有 id） | 手动根据常见炉石内容补充映射表 |
| 卡牌图片加载失败 | 使用占位图或只显示文字 |
| 大量卡牌渲染性能 | 使用虚拟滚动或分页 |

## 5. 元数据映射（手动补充）
根据炉石常识，初步确定映射关系：
- 职业：1=战士,2=萨满,3=猎人,4=骑士,5=死骑,6=牧师,7=盗贼,8=法师,9=术士,10=德鲁伊,11=恶魔猎手,12=中立
- 稀有度：1=普通,2=稀有,3=史诗,4=传说
- 种族：1=野兽,2=恶魔,3=龙,4=机械,5=海盗,6=鱼人,7=图腾,8=亡灵,9=元素,10=纳迦,11=野猪人,12=德莱尼


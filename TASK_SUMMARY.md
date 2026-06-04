# 炉石传说猜卡牌游戏 - 任务总结

## 任务目标

### 第一阶段：数据收集
1. 使用炉石传说官方卡牌接口获取所有卡牌信息
2. 将所有卡牌信息（包括元数据和枚举值）保存到本地
3. 使用 PowerShell 脚本执行数据收集

### 第二阶段：游戏开发
1. 基于收集的卡牌数据创建回合制猜卡牌游戏
2. 仅限随从卡牌
3. 游戏规则：
   - 后台随机选择一张随从卡牌
   - 用户有最多5条提示，6次猜测机会
   - 右侧提供元数据过滤器筛选卡牌
   - 每次猜测后反馈匹配的元数据数量
   - 猜对则游戏结束

### 技术要求
- 不要使用 PowerShell 脚本
- 使用 Bun 直接运行 TypeScript
- 使用 React 实现前端界面
- 合理拆分组件

## 当前状态

### ✅ 已完成的工作

#### 1. 数据准备
- **数据源文件**：`hs_cards_complete.json` (完整卡牌数据) 和 `hs_metadata.json` (元数据)
- **类型定义**：[src/types/index.ts](file:///c:/open/hs-puzzle/src/types/index.ts) - 定义了 Card、Hint、GuessResult 等核心类型
- **元数据配置**：[src/data/metadata.ts](file:///c:/open/hs-puzzle/src/data/metadata.ts) - 职业、稀有度、种族的ID到名称的映射
- **数据处理**：[src/data/index.ts](file:///c:/open/hs-puzzle/src/data/index.ts) - 包含示例卡牌数据和数据处理函数

#### 2. 组件架构
- **CardItem** ([src/components/CardItem.tsx](file:///c:/open/hs-puzzle/src/components/CardItem.tsx)): 卡牌卡片显示组件
- **MatchTag** ([src/components/MatchTag.tsx](file:///c:/open/hs-puzzle/src/components/MatchTag.tsx)): 匹配结果标签组件
- **SelectFilter** ([src/components/SelectFilter.tsx](file:///c:/open/hs-puzzle/src/components/SelectFilter.tsx)): 筛选器下拉框组件
- **CardSelector** ([src/components/CardSelector.tsx](file:///c:/open/hs-puzzle/src/components/CardSelector.tsx)): 卡牌选择区域组件
- **GuessHistory** ([src/components/GuessHistory.tsx](file:///c:/open/hs-puzzle/src/components/GuessHistory.tsx)): 猜测历史记录组件
- **HintPanel** ([src/components/HintPanel.tsx](file:///c:/open/hs-puzzle/src/components/HintPanel.tsx)): 提示面板组件
- **GameOverModal** ([src/components/GameOverModal.tsx](file:///c:/open/hs-puzzle/src/components/GameOverModal.tsx)): 游戏结束弹窗组件
- **GameBoard** ([src/components/GameBoard.tsx](file:///c:/open/hs-puzzle/src/components/GameBoard.tsx)): 游戏主界面组件

#### 3. 自定义Hooks
- **useGameState** ([src/hooks/useGameState.ts](file:///c:/open/hs-puzzle/src/hooks/useGameState.ts)): 管理游戏状态的核心Hook
  - 随机选择目标卡牌
  - 生成提示
  - 处理猜测逻辑
  - 判断游戏结束
- **useFilteredCards** ([src/hooks/useFilteredCards.ts](file:///c:/open/hs-puzzle/src/hooks/useFilteredCards.ts)): 管理筛选器状态

#### 4. 主应用
- **App.tsx** ([src/App.tsx](file:///c:/open/hs-puzzle/src/App.tsx)): 应用入口组件
- **index.tsx** ([src/index.tsx](file:///c:/open/hs-puzzle/src/index.tsx)): React 渲染入口

### 🎮 游戏功能

#### 核心特性
- ✅ 随机选择随从卡牌
- ✅ 最多5条提示（费用、攻击、生命、职业、种族、稀有度等）
- ✅ 最多6次猜测机会
- ✅ 每次猜测后显示8个属性的匹配情况
- ✅ 右侧元数据筛选器（费用、职业、种族、稀有度）
- ✅ 游戏结束时显示结果
- ✅ 新游戏功能

#### 游戏流程
1. 游戏自动选择一张随机随从卡牌
2. 用户可以点击"获取提示"按钮获得提示（最多5次）
3. 用户在右侧卡牌列表中选择猜测的卡牌
4. 系统显示本次猜测的匹配情况（8个属性的匹配数）
5. 重复步骤2-4直到猜对或用完6次机会
6. 游戏结束，显示结果和目标卡牌

### 🛠️ 技术栈

- **前端框架**: React 19
- **构建工具**: Rsbuild
- **包管理器**: Bun
- **开发语言**: TypeScript

### 📂 项目结构

```
src/
├── components/          # 组件目录
│   ├── CardItem.tsx    # 卡牌卡片组件
│   ├── MatchTag.tsx    # 匹配标签组件
│   ├── SelectFilter.tsx # 筛选器组件
│   ├── CardSelector.tsx # 卡牌选择组件
│   ├── GuessHistory.tsx # 猜测历史组件
│   ├── HintPanel.tsx   # 提示面板组件
│   ├── GameOverModal.tsx # 游戏结束弹窗
│   └── GameBoard.tsx   # 游戏主界面
├── hooks/             # 自定义Hooks
│   ├── useGameState.ts  # 游戏状态Hook
│   └── useFilteredCards.ts # 筛选器Hook
├── types/             # 类型定义
│   └── index.ts
├── data/              # 数据处理
│   ├── index.ts       # 数据处理函数
│   └── metadata.ts    # 元数据配置
├── App.tsx            # 主应用组件
└── index.tsx          # 渲染入口
```

## 当前问题和改进计划

### ⚠️ 当前问题
1. **数据源问题**：目前使用内联的示例卡牌数据，尚未完全集成 `hs_cards_complete.json` 中的完整数据
2. **元数据映射不完整**：卡牌系列等元数据映射需要完善

### 🔄 后续改进
1. 完整集成 `hs_cards_complete.json` 中的所有随从卡牌数据
2. 完善元数据映射（包括卡牌系列等）
3. 添加更多筛选条件（如攻击力、生命值范围）
4. 优化UI/UX设计
5. 添加卡牌搜索功能
6. 支持多语言

## 运行项目

### 开发模式
```bash
bun run dev
```
访问: http://localhost:3000/

### 生产构建
```bash
bun run build
```

### 预览生产构建
```bash
bun run preview
```

## 技术要点回顾

### 1. 组件拆分
- 单一职责原则，每个组件只负责一个功能
- 组件之间通过 props 和回调函数通信
- 使用自定义 Hooks 管理复杂状态逻辑

### 2. 状态管理
- 使用 React Hooks 管理游戏状态
- 分离关注点：游戏状态与筛选器状态分别管理
- 使用 useCallback 优化性能

### 3. 数据处理
- 从原始数据中筛选随从卡牌（card_type_id === 4）
- 只保留可收集的卡牌（collectible === 1）
- 建立元数据ID到名称的映射

### 4. 游戏逻辑
- 8个属性匹配：费用、攻击、生命、职业、种族、卡牌系列、稀有度、关键词
- 提示生成：从未使用的属性中随机选择
- 猜测验证：逐个属性比较，统计匹配数

## 总结

项目已成功实现了炉石传说猜卡牌游戏的核心功能，包括完整的游戏流程、提示系统、猜测历史和筛选功能。项目使用 React 并合理拆分了组件，使用自定义 Hooks 管理游戏状态。虽然目前使用的是示例数据，但架构已为集成完整卡牌数据做好了准备。

游戏现在可以在浏览器中访问 http://localhost:3000/ 进行体验。

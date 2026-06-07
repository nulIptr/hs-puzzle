import React from 'react';
import { useGameState } from '../hooks/useGameState';
import { useFilteredCards } from '../hooks/useFilteredCards';
import { useHistory } from '../hooks/useHistory';
import { CardSelector } from './CardSelector';
import { GuessHistory } from './GuessHistory';
import { HintPanel } from './HintPanel';
import { GameOverModal } from './GameOverModal';
import { HistoryModal } from './HistoryModal';
import { RulesModal } from './RulesModal';
import type { Card, GameMode, HistoryEntry } from '../types';
import { getPlayableCards, loadMinionCards } from '../data';
import { Classes, MinionTypes, Rarities, Series } from '../data/metadata';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

declare global {
  interface Window {
    hsDebug?: {
      showTarget: () => Card | null;
      help: () => void;
    };
  }
}

export const GameBoard: React.FC = () => {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = React.useState<GameMode>('standard');
  const [pendingMode, setPendingMode] = React.useState<GameMode | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [abandonOpen, setAbandonOpen] = React.useState(false);
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [playableCards, setPlayableCards] = React.useState<Card[]>([]);
  const [dataReady, setDataReady] = React.useState(false);

  // 首次进入时按需加载卡牌 JSON；切换游戏模式时再按当前模式重新筛选。
  React.useEffect(() => {
    let cancelled = false;
    setDataReady(false);
    getPlayableCards(gameMode).then((cards) => {
      if (cancelled) return;
      setPlayableCards(cards);
      setDataReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [gameMode]);

  // 兜底：若 getPlayableCards 因任何原因失败，至少保证随从数据进入缓存。
  React.useEffect(() => {
    loadMinionCards().catch(() => {
      /* 错误状态由 dataReady=false 体现，UI 已在下方显示加载提示 */
    });
  }, []);

  const {
    targetCard,
    currentRound,
    totalRounds,
    hints,
    guesses,
    remainingHints,
    maxHintTypes,
    gameOver,
    finalScore,
    abandoned,
    totalHints,
    totalGuesses,
    roundResults,
    startNewGame,
    getHint,
    makeGuess,
    abandonGame,
    feedback,
    solved
  } = useGameState(playableCards, gameMode);
  const { filter, setFilter, resetFilter } = useFilteredCards();
  const { history, addEntry, clearHistory } = useHistory();
  const [search, setSearch] = React.useState('');
  const isMobile = useIsMobile();

  // 每轮切换时重置筛选条件（自动进入下一轮 / 重新开局）
  React.useEffect(() => {
    resetFilter();
  }, [currentRound, resetFilter]);

  // 首次打开时自动弹出游戏规则，之后可由顶部「规则」按钮重新打开
  React.useEffect(() => {
    try {
      const seen = window.localStorage.getItem('hs-puzzle.rules.seen');
      if (!seen) setRulesOpen(true);
    } catch {
      setRulesOpen(true);
    }
  }, []);

  const closeRules = React.useCallback(() => {
    setRulesOpen(false);
    try {
      window.localStorage.setItem('hs-puzzle.rules.seen', '1');
    } catch {
      // localStorage 不可用也无所谓，下次仍会自动弹出
    }
  }, []);

  const handleNewGame = React.useCallback(() => {
    resetFilter();
    setSearch('');
    startNewGame();
  }, [resetFilter, startNewGame]);

  const handleModeChange = React.useCallback(
    (mode: GameMode) => {
      if (mode === gameMode) return;
      setPendingMode(mode);
    },
    [gameMode]
  );

  const confirmModeChange = React.useCallback(() => {
    if (!pendingMode) return;
    setGameMode(pendingMode);
    setPendingMode(null);
    resetFilter();
    setSearch('');
  }, [pendingMode, resetFilter]);

  const cancelModeChange = React.useCallback(() => {
    setPendingMode(null);
  }, []);

  // Save the completed game to history once
  const savedForGameRef = React.useRef<number>(0);
  React.useEffect(() => {
    if (!gameOver) return;
    if (savedForGameRef.current === finalScore && roundResults.length > 0) return;
    if (roundResults.length === 0) return;
    savedForGameRef.current = finalScore;

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      finishedAt: Date.now(),
      gameMode,
      score: finalScore,
      totalHints,
      totalGuesses,
      rounds: roundResults,
    };
    addEntry(entry);
  }, [gameOver, finalScore, roundResults, gameMode, totalHints, totalGuesses, addEntry]);

  const targetRef = React.useRef<Card | null>(null);
  const gameModeRef = React.useRef<GameMode>(gameMode);
  const playableCardsRef = React.useRef<Card[]>(playableCards);
  const currentRoundRef = React.useRef<number>(currentRound);
  const totalRoundsRef = React.useRef<number>(totalRounds);
  targetRef.current = targetCard;
  gameModeRef.current = gameMode;
  playableCardsRef.current = playableCards;
  currentRoundRef.current = currentRound;
  totalRoundsRef.current = totalRounds;

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    window.hsDebug = {
      showTarget: () => {
        const card = targetRef.current;
        if (!card) {
          console.warn('[hsDebug] 当前没有谜底，请先开始一局游戏。');
          return null;
        }
        console.group('%c🎯 当前谜底 (Target Card)', 'color:#ffd966;font-weight:bold;font-size:14px');
        console.log('完整对象:', card);
        console.log('图片链接:', card.image);
        console.log('图片(金色):', card.image_gold);
        console.log('裁剪图:', card.crop_image);
        console.table({
          ID: card.id,
          名称: card.name,
          费用: card.mana_cost,
          攻击: card.attack,
          生命: card.health,
          职业: Classes[card.class_id as keyof typeof Classes] || card.class_id,
          种族: card.minion_type_id
            ? MinionTypes[card.minion_type_id as keyof typeof MinionTypes] || card.minion_type_id
            : '无',
          稀有度: Rarities[card.rarity_id as keyof typeof Rarities] || card.rarity_id,
          系列: Series[String(card.card_set_id) as keyof typeof Series] || card.card_set_id,
          关键字: JSON.stringify(card.keyword_ids ?? null),
          符文: JSON.stringify(card.runeCost ?? null),
          描述: card.text || '(无)',
          风味: card.flavor_text || '(无)',
          画家: card.artist_name,
          收藏: card.collectible === 1 ? '可收藏' : '不可收藏',
          标准: card.standard === 1 ? '是' : '否',
          狂野: card.wild === 1 ? '是' : '否',
        });
        console.log('当前游戏模式:', gameModeRef.current, `(${playableCardsRef.current.length} 张可用)`);
        console.log('当前局数:', `${currentRoundRef.current + 1}/${totalRoundsRef.current}`);
        console.groupEnd();
        return card;
      },
      help: () => {
        console.log(
          '%c🎮 HS Puzzle 调试命令',
          'color:#ffd966;font-weight:bold;font-size:14px'
        );
        console.table({
          'hsDebug.showTarget()': '在控制台打印当前谜底及其所有属性',
          'hsDebug.help()': '显示此帮助',
        });
      },
    };
    console.log(
      '%c🎮 HS Puzzle 调试模式已启用，输入 hsDebug.help() 查看可用命令',
      'color:#ffd966;font-weight:bold'
    );
    return () => {
      delete window.hsDebug;
    };
  }, []);

  const handleCardSelect = React.useCallback(
    (card: Card) => {
      if (gameOver || solved) return;
      makeGuess(card);
    },
    [gameOver, solved, makeGuess]
  );

  const handleAbandonClick = React.useCallback(() => {
    if (gameOver) return;
    setAbandonOpen(true);
  }, [gameOver]);

  const cancelAbandon = React.useCallback(() => setAbandonOpen(false), []);

  const confirmAbandon = React.useCallback(() => {
    setAbandonOpen(false);
    abandonGame();
  }, [abandonGame]);

  if (!dataReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        加载卡牌数据中...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* 顶部品牌区 */}
      <div
        style={{
          padding: isMobile ? '8px 10px 4px 10px' : '12px 24px 4px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 16,
          flexWrap: 'wrap',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 18 : 22,
            color: '#3a2410',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          🎴 炉石猜猜乐
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 13,
              color: '#3a2410',
              background: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: 12,
            }}
          >
            第 <strong style={{ color: '#b85a00' }}>
              {Math.min(currentRound + 1, totalRounds)}
            </strong> / {totalRounds} 轮
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
              （每局 {totalRounds} 轮）
            </span>
          </span>
          <span
            style={{
              fontSize: 13,
              color: '#3a2410',
              background: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: 12,
            }}
          >
            提示: <strong style={{ color: '#b85a00' }}>{hints.length}</strong>/{maxHintTypes}
          </span>
          <span
            style={{
              fontSize: 13,
              color: '#3a2410',
              background: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: 12,
            }}
          >
            猜测: <strong style={{ color: '#1e5fb8' }}>{guesses.length}</strong>
          </span>
          <span
            title="历史最高分"
            style={{
              fontSize: 13,
              color: '#3a2410',
              background: 'rgba(255,255,255,0.4)',
              padding: '4px 10px',
              borderRadius: 12,
            }}
          >
            最高: <strong style={{ color: '#5a3a1a' }}>
              {history.length > 0 ? Math.max(...history.map((h) => h.score)) : 0}
            </strong>
          </span>
          <button
            onClick={handleNewGame}
            style={{
              padding: '4px 14px',
              background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
              color: 'white',
              border: '1px solid #2d661e',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            新游戏
          </button>
          <button
            onClick={handleAbandonClick}
            disabled={gameOver}
            title="放弃本局游戏（整局 5 轮判 0 分并结束）"
            style={{
              padding: '4px 14px',
              background: gameOver
                ? '#5a4a30'
                : 'linear-gradient(to bottom, #c4302b, #7a1a1a)',
              color: 'white',
              border: '1px solid #5a1010',
              borderRadius: 14,
              cursor: gameOver ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
              opacity: gameOver ? 0.6 : 1,
            }}
          >
            放弃本局
          </button>
          <button
            onClick={() => setRulesOpen(true)}
            title="查看游戏规则"
            style={{
              padding: '4px 14px',
              background: 'linear-gradient(to bottom, #b48eff, #6e4ec0)',
              color: 'white',
              border: '1px solid #3f2a7a',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            📖 规则
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            style={{
              padding: '4px 14px',
              background: 'linear-gradient(to bottom, #4ea8ff, #1e5fb8)',
              color: 'white',
              border: '1px solid #163f7a',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            📜 历史{history.length > 0 ? ` (${history.length})` : ''}
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            title="查看全服排行榜"
            style={{
              padding: '4px 14px',
              background: 'linear-gradient(to bottom, #ffd966, #b87a2a)',
              color: '#1a1208',
              border: '1px solid #5a3a1a',
              borderRadius: 14,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            🏆 排行榜
          </button>
          <div
            role="group"
            aria-label="游戏模式"
            style={{
              display: 'inline-flex',
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid #5a3a1a',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
              background: '#2a1f17',
            }}
          >
            {(['standard', 'wild'] as const).map((mode, idx) => {
              const active = gameMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  aria-pressed={active}
                  style={{
                    padding: '4px 14px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    borderLeft: idx === 0 ? 'none' : '1px solid #5a3a1a',
                    background: active
                      ? 'linear-gradient(to bottom, #ffd966, #b87a2a)'
                      : 'transparent',
                    color: active ? '#1a1208' : '#f4e4bc',
                    textShadow: active ? '0 1px 0 rgba(255,255,255,0.3)' : 'none',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {mode === 'standard' ? '标准' : '狂野'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 顶部筛选条 + 提示/历史 侧栏 + 主区 */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flex: 1,
          minHeight: 0,
          padding: isMobile ? '6px 8px 8px 8px' : '8px 16px 16px 16px',
          gap: isMobile ? 6 : 12,
        }}
      >
        {/* 侧栏（核心功能：始终可见） */}
        <div
          style={{
            width: isMobile ? '100%' : 320,
            // 移动端限制侧栏最大高度，让 CardSelector 至少能拿到屏幕一半的高度
            maxHeight: isMobile ? '35vh' : undefined,
            background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
            border: '2px solid #5a3a1a',
            borderRadius: 8,
            padding: isMobile ? 8 : 12,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 8 : 12,
            color: '#f4e4bc',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <HintPanel
            hints={hints}
            remainingHints={remainingHints}
            maxHintTypes={maxHintTypes}
            onGetHint={getHint}
            compact={isMobile}
          />
          <GuessHistory
            guesses={guesses}
            excludedCardIds={guesses.map((g) => g.card.id)}
            compact={isMobile}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <CardSelector
            cards={playableCards}
            filter={filter}
            setFilter={setFilter}
            onCardSelect={handleCardSelect}
            hints={hints}
            guesses={guesses}
            search={search}
            setSearch={setSearch}
          />
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        finalScore={finalScore}
        totalHints={totalHints}
        totalGuesses={totalGuesses}
        rounds={roundResults}
        abandoned={abandoned}
        gameMode={gameMode}
        onRestart={handleNewGame}
        onShowHistory={() => setHistoryOpen(true)}
        onNavigateLeaderboard={() => navigate('/leaderboard')}
      />

      <HistoryModal
        isOpen={historyOpen}
        history={history}
        currentGame={{
          gameMode,
          currentRound,
          totalRounds,
          hints,
          guesses,
          roundResults,
          targetCard: targetCard,
          gameOver,
        }}
        onClose={() => setHistoryOpen(false)}
        onClear={clearHistory}
      />

      <RulesModal isOpen={rulesOpen} onClose={closeRules} showSampleCard />

      {/* 反馈提示（toast） */}
      {feedback && !solved && (
        <div
          key={feedback.id}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 950,
            background:
              feedback.tone === 'success'
                ? 'linear-gradient(to bottom, #5fb24a, #3e8a2c)'
                : feedback.tone === 'error'
                ? 'linear-gradient(to bottom, #c4302b, #7a1a1a)'
                : 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
            color: 'white',
            border:
              feedback.tone === 'info'
                ? '1px solid #5a3a1a'
                : '1px solid rgba(0,0,0,0.4)',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            textShadow: feedback.tone === 'info' ? 'none' : '0 1px 1px rgba(0,0,0,0.3)',
            maxWidth: '80vw',
            textAlign: 'center',
            animation: 'hs-toast-in 0.2s ease-out',
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* 猜对庆祝覆盖层 */}
      {solved && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 920,
            animation: 'hs-fade-in 0.2s ease-out',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
              border: '2px solid #ffd966',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: '#f4e4bc',
              boxShadow: '0 0 30px rgba(255,217,102,0.4)',
              animation: 'hs-pop-in 0.25s ease-out',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#ffd966',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}
            >
              🎉 答对了！第 {solved.roundIndex + 1} / {totalRounds} 轮
            </div>
            <div style={{ fontSize: 13, color: '#a08a6a' }}>{solved.card.name}</div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                fontSize: 13,
                color: '#f4e4bc',
              }}
            >
              <span>
                提示 <strong style={{ color: '#b85a00' }}>{solved.hintCount}</strong>
              </span>
              <span>
                猜测 <strong style={{ color: '#1e5fb8' }}>{solved.guessCount}</strong>
              </span>
              <span>
                得分 <strong style={{ color: '#ffd966' }}>{Math.max(0, 1000 - solved.hintCount * 80 - solved.guessCount * 50)}</strong>
              </span>
            </div>
            {solved.isLastRound ? (
              <div style={{ fontSize: 12, color: '#a08a6a', marginTop: 4 }}>
                本局即将结算…
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#a08a6a', marginTop: 4 }}>
                {Math.max(0, Math.ceil(1.8))} 秒后进入下一轮…
              </div>
            )}
          </div>
        </div>
      )}

      {/* 放弃本局 二次确认 */}
      {abandonOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="abandon-title"
          aria-describedby="abandon-desc"
          onClick={cancelAbandon}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1010,
            animation: 'hs-fade-in 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
              border: '2px solid #c4302b',
              borderRadius: 10,
              padding: '22px 26px',
              minWidth: 320,
              maxWidth: 460,
              color: '#f4e4bc',
              boxShadow: '0 10px 32px rgba(0,0,0,0.6), 0 0 24px rgba(196,48,43,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'hs-pop-in 0.22s ease-out',
            }}
          >
            <div
              id="abandon-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 16,
                fontWeight: 700,
                color: '#ff7a73',
              }}
            >
              <span style={{ fontSize: 20 }}>⚠️</span>
              放弃本局游戏
            </div>
            <div
              id="abandon-desc"
              style={{ fontSize: 13, lineHeight: 1.7, color: '#f4e4bc' }}
            >
              每局游戏包含 <strong style={{ color: '#ffd966' }}>{totalRounds}</strong> 轮。
              放弃本局将<strong style={{ color: '#ff7a73' }}>整局结束</strong>，
              已完成的轮次按实际得分计入，
              其余 <strong style={{ color: '#ffd966' }}>{Math.max(totalRounds - currentRound, 0)}</strong> 轮未完成的卡牌将记为 0 分。
              本次操作不可撤销，是否确认？
            </div>
            <div
              style={{
                background: 'rgba(196,48,43,0.12)',
                border: '1px solid rgba(196,48,43,0.4)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 12,
                color: '#ffb3ad',
              }}
            >
              提示：放弃后可以在「再来一局」开启新的 5 轮游戏。
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelAbandon}
                style={{
                  padding: '6px 18px',
                  background: 'transparent',
                  color: '#f4e4bc',
                  border: '1px solid #5a3a1a',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                继续游戏
              </button>
              <button
                onClick={confirmAbandon}
                style={{
                  padding: '6px 18px',
                  background: 'linear-gradient(to bottom, #c4302b, #7a1a1a)',
                  color: 'white',
                  border: '1px solid #5a1010',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                }}
              >
                确认放弃
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMode && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={cancelModeChange}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
              border: '2px solid #5a3a1a',
              borderRadius: 10,
              padding: '20px 24px',
              minWidth: 280,
              maxWidth: 420,
              color: '#f4e4bc',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#ffd966',
              }}
            >
              切换游戏模式
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              切换至「
              <strong style={{ color: '#ffd966' }}>
                {pendingMode === 'standard' ? '标准' : '狂野'}
              </strong>
              」模式将会开启新游戏，当前进度将被重置。是否继续？
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelModeChange}
                style={{
                  padding: '6px 16px',
                  background: 'transparent',
                  color: '#f4e4bc',
                  border: '1px solid #5a3a1a',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                取消
              </button>
              <button
                onClick={confirmModeChange}
                style={{
                  padding: '6px 16px',
                  background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
                  color: 'white',
                  border: '1px solid #2d661e',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

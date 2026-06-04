
import React from 'react';
import type { Card, GameMode, GuessResult, Hint, HistoryEntry, RoundResult } from '../types';
import { calculateRoundScore } from '../hooks/useGameState';

export interface CurrentGameState {
  gameMode: GameMode;
  currentRound: number;
  totalRounds: number;
  hints: Hint[];
  guesses: GuessResult[];
  roundResults: RoundResult[];
  targetCard: Card | null;
  gameOver: boolean;
}

interface HistoryModalProps {
  isOpen: boolean;
  history: HistoryEntry[];
  currentGame?: CurrentGameState | null;
  onClose: () => void;
  onClear: () => void;
}

const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const modeLabel = (m: GameMode): string =>
  m === 'standard' ? '标准' : '狂野';

interface RoundSummary {
  card: Card | null;
  hintCount: number;
  guessCount: number;
  isCurrent: boolean;
  isSolved: boolean;
}

const HIDDEN_CARD_NAME = '???';
const HIDDEN_CARD_TILE: React.CSSProperties = {
  width: 44,
  height: 60,
  background: 'linear-gradient(to bottom, #2a1f17, #1a1208)',
  border: '1px solid #5a3a1a',
  borderRadius: 4,
  display: 'inline-block',
};

const buildCurrentRounds = (g: CurrentGameState): RoundSummary[] => {
  const completed: RoundSummary[] = g.roundResults.map((r) => ({
    card: r.card,
    hintCount: r.hintCount,
    guessCount: r.guessCount,
    isCurrent: false,
    isSolved: true,
  }));
  const current: RoundSummary | null =
    g.targetCard && !g.gameOver
      ? {
          card: null,
          hintCount: g.hints.length,
          guessCount: g.guesses.length,
          isCurrent: true,
          isSolved: false,
        }
      : null;
  return current ? [...completed, current] : completed;
};

const CurrentGameSection: React.FC<{ g: CurrentGameState }> = ({ g }) => {
  const rounds = buildCurrentRounds(g);
  const solvedRounds = rounds.filter((r) => r.isSolved);
  const totalHints =
    solvedRounds.reduce((s, r) => s + r.hintCount, 0) + g.hints.length;
  const totalGuesses =
    solvedRounds.reduce((s, r) => s + r.guessCount, 0) + g.guesses.length;
  const runningScore = solvedRounds.reduce(
    (s, r) => s + calculateRoundScore(r.hintCount, r.guessCount),
    0
  );
  const status: 'over' | 'solving' = g.gameOver ? 'over' : 'solving';
  const currentRoundDisplay = g.gameOver
    ? g.totalRounds
    : Math.min(g.currentRound + 1, g.totalRounds);

  return (
    <div
      style={{
        background: 'rgba(255,217,102,0.08)',
        border: '1px solid #ffd966',
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffd966',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span>📍 本局进行中</span>
          <span
            style={{
              padding: '1px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4,
              fontSize: 11,
              color: '#f4e4bc',
            }}
          >
            {modeLabel(g.gameMode)}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: status === 'over' ? '#5fb24a' : '#a08a6a',
            fontWeight: 600,
          }}
        >
          {status === 'over' ? '✓ 已完成' : `第 ${currentRoundDisplay} / ${g.totalRounds} 轮`}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 12,
          color: '#f4e4bc',
        }}
      >
        <span>
          已用提示:{' '}
          <strong style={{ color: '#b85a00' }}>{totalHints}</strong>
        </span>
        <span>
          已用猜测:{' '}
          <strong style={{ color: '#1e5fb8' }}>{totalGuesses}</strong>
        </span>
        {solvedRounds.length > 0 && (
          <span>
            当前得分:{' '}
            <strong style={{ color: '#ffd966' }}>{runningScore}</strong>
          </span>
        )}
      </div>

      {g.guesses.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            maxHeight: 140,
            overflowY: 'auto',
            borderTop: '1px solid rgba(255,217,102,0.2)',
            paddingTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#a08a6a',
              fontWeight: 600,
            }}
          >
            本局猜测序列
          </div>
          {g.guesses.map((guess, idx) => (
            <div
              key={guess.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#f4e4bc',
                padding: '2px 4px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 3,
              }}
            >
              <span>
                #{idx + 1} {guess.card.name}
              </span>
              <span style={{ color: '#a08a6a' }}>
                匹配 {guess.matchCount}/7
              </span>
            </div>
          ))}
        </div>
      )}

      {rounds.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            borderTop: '1px solid rgba(255,217,102,0.2)',
            paddingTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#a08a6a',
              fontWeight: 600,
            }}
          >
            局数回顾
          </div>
          {rounds.map((r, idx) => (
            <div
              key={`${r.isCurrent ? 'current' : r.card?.id ?? idx}-${idx}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11,
                color: r.isCurrent ? '#ffd966' : '#f4e4bc',
                padding: '2px 4px',
                background: r.isCurrent ? 'rgba(255,217,102,0.15)' : 'rgba(0,0,0,0.25)',
                border: r.isCurrent ? '1px solid #ffd966' : '1px solid transparent',
                borderRadius: 3,
                fontWeight: r.isCurrent ? 600 : 400,
                gap: 6,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                }}
                title={r.isCurrent ? '未揭晓，不显示目标卡牌' : r.card?.name}
              >
                {r.isCurrent && <span style={HIDDEN_CARD_TILE} aria-hidden="true" />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{idx + 1} {r.isCurrent ? HIDDEN_CARD_NAME : r.card?.name}
                  {r.isCurrent && ' (进行中)'}
                </span>
              </span>
              <span style={{ color: '#a08a6a', flexShrink: 0 }}>
                提{r.hintCount} / 猜{r.guessCount}
                {r.isSolved && (
                  <span style={{ color: '#ffd966', marginLeft: 6 }}>
                    {calculateRoundScore(r.hintCount, r.guessCount)}分
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  currentGame,
  onClose,
  onClear,
}) => {
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const [tab, setTab] = React.useState<'current' | 'history'>('current');

  React.useEffect(() => {
    if (!isOpen) {
      setConfirmingClear(false);
      setTab('current');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
          minWidth: 380,
          maxWidth: 600,
          maxHeight: '85vh',
          width: '90%',
          color: '#f4e4bc',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'baseline',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ffd966' }}>
              📜 记录
            </div>
            <span style={{ fontSize: 11, color: '#a08a6a' }}>
              {history.length > 0 ? `历史最高 ${Math.max(...history.map((h) => h.score))} 分` : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#f4e4bc',
              border: '1px solid #5a3a1a',
              borderRadius: 8,
              padding: '2px 10px',
              cursor: 'pointer',
              fontSize: 13,
            }}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div
          role="tablist"
          style={{
            display: 'inline-flex',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #5a3a1a',
            background: '#1f1810',
            alignSelf: 'flex-start',
          }}
        >
          {(
            [
              { key: 'current', label: '本局', count: currentGame ? 1 : 0 },
              {
                key: 'history',
                label: '历史',
                count: history.length,
              },
            ] as const
          ).map((t, idx) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
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
                }}
              >
                {t.label} {t.count > 0 ? `(${t.count})` : ''}
              </button>
            );
          })}
        </div>

        {tab === 'current' && (
          currentGame ? (
            <CurrentGameSection g={currentGame} />
          ) : (
            <div
              style={{
                color: '#a08a6a',
                textAlign: 'center',
                padding: '24px 12px',
                fontSize: 13,
              }}
            >
              当前没有进行中的游戏
            </div>
          )
        )}

        {tab === 'history' && (
          history.length === 0 ? (
            <div
              style={{
                color: '#a08a6a',
                textAlign: 'center',
                padding: '24px 12px',
                fontSize: 13,
              }}
            >
              暂无历史记录
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#a08a6a',
                }}
              >
                <span>共 {history.length} 条通关记录</span>
                {!confirmingClear ? (
                  <button
                    onClick={() => setConfirmingClear(true)}
                    style={{
                      background: 'transparent',
                      color: '#c4302b',
                      border: '1px solid #7a1a1a',
                      borderRadius: 8,
                      padding: '2px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    清空
                  </button>
                ) : (
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        onClear();
                        setConfirmingClear(false);
                      }}
                      style={{
                        background: 'linear-gradient(to bottom, #c4302b, #7a1a1a)',
                        color: 'white',
                        border: '1px solid #5a1010',
                        borderRadius: 8,
                        padding: '2px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      确认清空
                    </button>
                    <button
                      onClick={() => setConfirmingClear(false)}
                      style={{
                        background: 'transparent',
                        color: '#f4e4bc',
                        border: '1px solid #5a3a1a',
                        borderRadius: 8,
                        padding: '2px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      取消
                    </button>
                  </span>
                )}
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingRight: 2,
                }}
              >
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid #5a3a1a',
                      borderRadius: 6,
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          fontSize: 12,
                          color: '#a08a6a',
                        }}
                      >
                        <span>{formatDate(entry.finishedAt)}</span>
                        <span
                          style={{
                            padding: '1px 6px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            color: '#f4e4bc',
                          }}
                        >
                          {modeLabel(entry.gameMode)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#ffd966',
                        }}
                      >
                        {entry.score} 分
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 12,
                        color: '#f4e4bc',
                      }}
                    >
                      <span>
                        提示: <strong style={{ color: '#b85a00' }}>{entry.totalHints}</strong>
                      </span>
                      <span>
                        猜测: <strong style={{ color: '#1e5fb8' }}>{entry.totalGuesses}</strong>
                      </span>
                      <span>
                        局数: <strong>{entry.rounds.length}</strong>
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        fontSize: 11,
                        color: '#a08a6a',
                      }}
                    >
                      {entry.rounds.map((r, idx) => (
                        <span
                          key={idx}
                          title={r.card.name}
                          style={{
                            padding: '1px 6px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: 4,
                          }}
                        >
                          #{idx + 1} {r.card.name} · 提{r.hintCount}/猜{r.guessCount}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

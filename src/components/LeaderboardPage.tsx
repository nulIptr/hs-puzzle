
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaderboard, GAME_VERSION, type LeaderboardEntry } from '../lib/leaderboardApi';
import type { GameMode } from '../types';

const MODES: { value: GameMode; label: string }[] = [
  { value: 'standard', label: '标准' },
  { value: 'wild', label: '狂野' },
];

const tierColor = (score: number): string => {
  if (score >= 4500) return '#ffd966';
  if (score >= 3500) return '#5fb24a';
  if (score >= 2500) return '#4ea8ff';
  if (score >= 1500) return '#c89a3a';
  return '#c4302b';
};

const formatDate = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const LeaderboardPage: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('standard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version] = useState(GAME_VERSION);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLeaderboard({ mode, version, limit: 20, signal });
        setEntries(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : '加载失败');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [mode, version]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #2a1f17, #1a1208)',
        color: '#f4e4bc',
        padding: '20px 16px 60px 16px',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: '0 auto',
          background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
          border: '2px solid #5a3a1a',
          borderRadius: 12,
          padding: '20px 24px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              color: '#ffd966',
              textShadow: '0 2px 0 rgba(0,0,0,0.4)',
              letterSpacing: 1,
            }}
          >
            🏆 炉石猜猜乐 · 排行榜
          </h1>
          <Link
            to="/"
            style={{
              padding: '6px 16px',
              fontSize: 13,
              background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
              color: 'white',
              border: '1px solid #2d661e',
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: 'none',
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            ← 返回游戏
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#a08a6a' }}>游戏模式:</span>
            <div
              role="group"
              aria-label="游戏模式"
              style={{
                display: 'inline-flex',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #5a3a1a',
                background: '#1a1208',
              }}
            >
              {MODES.map((m, idx) => {
                const active = mode === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
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
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#a08a6a' }}>
            版本: <strong style={{ color: '#ffd966' }}>{version}</strong> · 显示前 20 名
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(196,48,43,0.18)',
              border: '1px solid #5a1010',
              borderRadius: 8,
              color: '#ffb3ad',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            ❌ 加载失败: {error}
            <button
              onClick={() => load()}
              style={{
                marginLeft: 12,
                padding: '2px 10px',
                fontSize: 12,
                background: 'transparent',
                color: '#f4e4bc',
                border: '1px solid #5a3a1a',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: '#a08a6a',
              fontSize: 14,
            }}
          >
            加载中...
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: '#a08a6a',
              fontSize: 14,
            }}
          >
            🏜️ 暂无记录, 来当第一个上榜的玩家吧!
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const medal =
                rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto auto auto',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background:
                      rank === 1
                        ? 'linear-gradient(to right, rgba(255,217,102,0.18), rgba(0,0,0,0.2))'
                        : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${rank <= 3 ? '#ffd966' : '#5a3a1a'}`,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: rank <= 3 ? 22 : 14,
                      fontWeight: 800,
                      color: rank <= 3 ? '#ffd966' : '#a08a6a',
                      textAlign: 'center',
                    }}
                  >
                    {medal}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#f4e4bc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={entry.username}
                  >
                    {entry.username}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: tierColor(entry.score),
                      minWidth: 80,
                      textAlign: 'right',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  >
                    {entry.score}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 12,
                      color: '#a08a6a',
                      minWidth: 120,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span>
                      提{' '}
                      <strong style={{ color: '#b85a00' }}>{entry.totalHints}</strong>
                    </span>
                    <span>
                      猜{' '}
                      <strong style={{ color: '#1e5fb8' }}>{entry.totalGuesses}</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#a08a6a',
                      minWidth: 130,
                      textAlign: 'right',
                    }}
                    title={new Date(entry.createdAt).toLocaleString()}
                  >
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            color: '#a08a6a',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          排行榜按总分降序排列, 同分时按时间升序。
          <br />
          仅展示「正常结束」且 5 轮全部猜中的成绩。
        </div>
      </div>
    </div>
  );
};

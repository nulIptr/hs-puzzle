
import React, { useEffect, useState } from 'react';
import { CardItem } from './CardItem';
import type { Card, GameMode, RoundResult } from '../types';
import {
  getStoredUsername,
  isValidUsername,
  sanitizeUsername,
  setStoredUsername,
} from '../lib/username';
import { GAME_VERSION, submitScore, toSubmitRounds } from '../lib/leaderboardApi';

interface GameOverModalProps {
  isOpen: boolean;
  finalScore: number;
  totalHints: number;
  totalGuesses: number;
  rounds: RoundResult[];
  abandoned: boolean;
  gameMode: GameMode;
  onRestart: () => void;
  onShowHistory: () => void;
  onNavigateLeaderboard: () => void;
}

const scoreTier = (score: number): { label: string; color: string } => {
  if (score >= 4500) return { label: 'S · 炉石传说', color: '#ffd966' };
  if (score >= 3500) return { label: 'A · 大师级', color: '#5fb24a' };
  if (score >= 2500) return { label: 'B · 熟练', color: '#4ea8ff' };
  if (score >= 1500) return { label: 'C · 一般', color: '#c89a3a' };
  return { label: 'D · 再接再厉', color: '#c4302b' };
};

type UploadState =
  | { kind: 'idle' }
  | { kind: 'editing' }
  | { kind: 'uploading' }
  | { kind: 'success'; rank: number }
  | { kind: 'error'; message: string };

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  finalScore,
  totalHints,
  totalGuesses,
  rounds,
  abandoned,
  gameMode,
  onRestart,
  onShowHistory,
  onNavigateLeaderboard,
}) => {
  const [storedName, setStoredName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [upload, setUpload] = useState<UploadState>({ kind: 'idle' });

  // 每次打开结算页: 读取 localStorage 中的用户名, 复位上传状态
  useEffect(() => {
    if (!isOpen) return;
    setStoredName(getStoredUsername());
    setEditingName('');
    setUpload({ kind: 'idle' });
  }, [isOpen]);

  if (!isOpen) return null;

  const tier = scoreTier(finalScore);
  const maxScore = rounds.length * 1000;
  const canUpload = !abandoned && rounds.length === 5 && finalScore > 0;

  const beginEditName = () => {
    setEditingName(storedName);
    setUpload({ kind: 'editing' });
  };

  const cancelEdit = () => {
    setEditingName('');
    setUpload({ kind: 'idle' });
  };

  const commitName = () => {
    const cleaned = sanitizeUsername(editingName);
    if (!isValidUsername(cleaned)) {
      setUpload({ kind: 'error', message: '用户名长度需在 1~20 个字符' });
      return;
    }
    setStoredName(setStoredUsername(cleaned));
    setEditingName('');
    setUpload({ kind: 'idle' });
  };

  const handleUpload = async () => {
    const name = storedName;
    if (!isValidUsername(name)) {
      setUpload({ kind: 'error', message: '请先设置一个用户名' });
      return;
    }
    setUpload({ kind: 'uploading' });
    try {
      const result = await submitScore({
        username: name,
        score: finalScore,
        gameMode,
        totalHints,
        totalGuesses,
        rounds: toSubmitRounds(rounds),
        version: GAME_VERSION,
      });
      setUpload({ kind: 'success', rank: result.rank });
    } catch (e) {
      setUpload({
        kind: 'error',
        message: e instanceof Error ? e.message : '上传失败',
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
          padding: 24,
          borderRadius: 10,
          maxWidth: 640,
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          textAlign: 'center',
          border: '2px solid #ffd966',
          boxShadow: '0 0 30px rgba(255,217,102,0.3)',
          color: '#f4e4bc',
        }}
      >
        <h2
          style={{
            fontSize: 22,
            margin: '0 0 8px 0',
            color: abandoned ? '#ff7a73' : '#ffd966',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {abandoned ? '本局已放弃' : `🎉 通关！本局 ${rounds.length} 轮全部猜中`}
        </h2>

        <div
          style={{
            fontSize: 12,
            color: '#a08a6a',
            marginBottom: 14,
          }}
        >
          {abandoned
            ? '本局已放弃，已完成的轮次和未完成的轮次都不会计入最终分数'
            : '提示次数越少、猜测次数越少，分数越高'}
        </div>

        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${abandoned ? '#5a1010' : '#5a3a1a'}`,
            borderRadius: 8,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {abandoned ? (
            <>
              <div
                style={{
                  fontSize: 13,
                  color: '#a08a6a',
                  letterSpacing: 1,
                }}
              >
                最终得分
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: '#ff7a73',
                  textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                  lineHeight: 1.1,
                }}
              >
                —
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#ff7a73',
                  marginTop: 4,
                }}
              >
                本局已放弃 · 不计分
              </div>
              <div style={{ fontSize: 12, color: '#a08a6a' }}>
                已完成 {rounds.filter((r) => r.guessCount > 0).length} 轮，
                未完成 {rounds.filter((r) => r.guessCount === 0).length} 轮记 0 分
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 13,
                  color: '#a08a6a',
                  letterSpacing: 1,
                }}
              >
                最终得分
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: tier.color,
                  textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                  lineHeight: 1.1,
                }}
              >
                {finalScore}
              </div>
              <div style={{ fontSize: 12, color: '#a08a6a' }}>
                / {maxScore}（每轮满分 1000）
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: tier.color,
                  marginTop: 4,
                }}
              >
                {tier.label}
              </div>
            </>
          )}
          <div
            style={{
              display: 'flex',
              gap: 18,
              fontSize: 13,
              marginTop: 6,
            }}
          >
            <span>
              总提示:{' '}
              <strong style={{ color: '#b85a00', fontSize: 16 }}>{totalHints}</strong>
            </span>
            <span>
              总猜测:{' '}
              <strong style={{ color: '#1e5fb8', fontSize: 16 }}>{totalGuesses}</strong>
            </span>
          </div>
        </div>

        {/* 排行榜上传区 - 仅正常结束的局可上传 */}
        {canUpload && (
          <div
            data-testid="leaderboard-upload"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid #5a3a1a',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffd966',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>🏆</span>
              上传至排行榜 ({GAME_VERSION})
            </div>

            {upload.kind === 'editing' ? (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  placeholder="输入用户名 (1~20 字符)"
                  maxLength={20}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: '6px 10px',
                    fontSize: 13,
                    background: '#1a1208',
                    color: '#f4e4bc',
                    border: '1px solid #5a3a1a',
                    borderRadius: 6,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={commitName}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
                    color: 'white',
                    border: '1px solid #2d661e',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    background: 'transparent',
                    color: '#f4e4bc',
                    border: '1px solid #5a3a1a',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#a08a6a', flex: 1, minWidth: 140 }}>
                  用户名:{' '}
                  <strong style={{ color: storedName ? '#ffd966' : '#ff7a73' }}>
                    {storedName || '未设置'}
                  </strong>
                </div>
                <button
                  onClick={beginEditName}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    background: 'transparent',
                    color: '#f4e4bc',
                    border: '1px solid #5a3a1a',
                    borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  {storedName ? '修改' : '设置用户名'}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!storedName || upload.kind === 'uploading'}
                  style={{
                    padding: '6px 16px',
                    fontSize: 13,
                    background:
                      !storedName || upload.kind === 'uploading'
                        ? '#5a4a30'
                        : 'linear-gradient(to bottom, #ffd966, #b87a2a)',
                    color: !storedName || upload.kind === 'uploading' ? '#a08a6a' : '#1a1208',
                    border: '1px solid #5a3a1a',
                    borderRadius: 12,
                    cursor:
                      !storedName || upload.kind === 'uploading' ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {upload.kind === 'uploading' ? '上传中…' : '🏆 上传分数'}
                </button>
              </div>
            )}

            {/* 状态提示 */}
            {upload.kind === 'success' && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#0a3a0a',
                  background: 'linear-gradient(to bottom, #b6e2a3, #7fc465)',
                  border: '1px solid #2d661e',
                  borderRadius: 6,
                  fontWeight: 700,
                }}
              >
                🎉 上传成功! 当前排名第{' '}
                <strong style={{ color: '#5a1010' }}>#{upload.rank}</strong>
                <button
                  onClick={onNavigateLeaderboard}
                  style={{
                    marginLeft: 10,
                    padding: '2px 10px',
                    fontSize: 11,
                    background: 'transparent',
                    color: '#1a1208',
                    border: '1px solid #2d661e',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  查看排行榜
                </button>
              </div>
            )}
            {upload.kind === 'error' && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#ffb3ad',
                  background: 'rgba(196,48,43,0.18)',
                  border: '1px solid #5a1010',
                  borderRadius: 6,
                }}
              >
                ❌ {upload.message}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffd966',
            textAlign: 'left',
            marginBottom: 8,
          }}
        >
          各轮回顾
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {rounds.map((round, idx) => {
            const card: Card = round.card;
            return (
              <div
                key={card.id}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #5a3a1a',
                  borderRadius: 6,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <CardItem card={card} onClick={() => { }} compact />
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#ffd966',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    #{idx + 1}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#f4e4bc',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={card.name}
                >
                  {card.name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 11,
                    color: '#a08a6a',
                  }}
                >
                  <span>提 {round.hintCount}</span>
                  <span>猜 {round.guessCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {
            !abandoned && <button
              onClick={onShowHistory}
              style={{
                padding: '8px 22px',
                fontSize: 13,
                background: 'transparent',
                color: '#f4e4bc',
                border: '1px solid #5a3a1a',
                borderRadius: 14,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              查看历史
            </button>
          }
          <button
            onClick={onRestart}
            style={{
              padding: '8px 28px',
              fontSize: 14,
              background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
              color: 'white',
              border: '1px solid #2d661e',
              borderRadius: 14,
              cursor: 'pointer',
              fontWeight: 700,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

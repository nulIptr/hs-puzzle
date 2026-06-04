
import React from 'react';
import { CardItem } from './CardItem';
import type { Card, RoundResult } from '../types';

interface GameOverModalProps {
  isOpen: boolean;
  finalScore: number;
  totalHints: number;
  totalGuesses: number;
  rounds: RoundResult[];
  abandoned: boolean;
  onRestart: () => void;
  onShowHistory: () => void;
}

const scoreTier = (score: number): { label: string; color: string } => {
  if (score >= 4500) return { label: 'S · 炉石传说', color: '#ffd966' };
  if (score >= 3500) return { label: 'A · 大师级', color: '#5fb24a' };
  if (score >= 2500) return { label: 'B · 熟练', color: '#4ea8ff' };
  if (score >= 1500) return { label: 'C · 一般', color: '#c89a3a' };
  return { label: 'D · 再接再厉', color: '#c4302b' };
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  finalScore,
  totalHints,
  totalGuesses,
  rounds,
  abandoned,
  onRestart,
  onShowHistory,
}) => {
  if (!isOpen) return null;

  const tier = scoreTier(finalScore);
  const maxScore = rounds.length * 1000;

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

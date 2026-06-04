
import React from 'react';
import { CardItem } from './CardItem';
import { Card } from '../types';

interface GameOverModalProps {
  isOpen: boolean;
  won: boolean;
  targetCard: Card | null;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  won,
  targetCard,
  onRestart,
}) => {
  if (!isOpen || !targetCard) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
          {won ? '🎉 恭喜你猜对了！' : '😢 游戏结束'}
        </h2>
        <p style={{ marginBottom: '20px' }}>
          {won ? '你真厉害！' : '答案揭晓：'}
        </p>
        <CardItem card={targetCard} onClick={() => {}} />
        <button
          onClick={onRestart}
          style={{
            marginTop: '24px',
            padding: '10px 32px',
            fontSize: '16px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  );
};


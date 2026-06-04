
import React from 'react';
import type { Hint } from '../types';

interface HintPanelProps {
  hints: Hint[];
  remainingHints: number;
  maxHintTypes: number;
  onGetHint: () => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  remainingHints,
  maxHintTypes,
  onGetHint,
}) => {
  const used = hints.length;
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid #5a3a1a',
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong style={{ color: '#ffd966', fontSize: 13 }}>
          提示 ({used}/{maxHintTypes})
        </strong>
        <button
          onClick={onGetHint}
          disabled={remainingHints === 0}
          style={{
            padding: '4px 12px',
            background:
              remainingHints > 0
                ? 'linear-gradient(to bottom, #ffd966, #b87a2a)'
                : '#5a4a30',
            color: remainingHints > 0 ? '#1a1208' : '#aaa',
            border: '1px solid #5a3a1a',
            borderRadius: 12,
            cursor: remainingHints > 0 ? 'pointer' : 'not-allowed',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          获取提示
        </button>
      </div>
      {hints.map((hint, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(255,217,102,0.15)',
            border: '1px solid #5a3a1a',
            color: '#f4e4bc',
            padding: '6px 10px',
            borderRadius: 4,
            marginBottom: 4,
            fontSize: 12,
          }}
        >
          <span style={{ color: '#ffd966' }}>{hint.label}</span>: {hint.value}
        </div>
      ))}
      {hints.length === 0 && (
        <div style={{ color: '#a08a6a', fontSize: 12 }}>点击按钮获取提示</div>
      )}
    </div>
  );
};

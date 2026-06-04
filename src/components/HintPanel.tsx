
import React from 'react';
import { Hint } from '../types';

interface HintPanelProps {
  hints: Hint[];
  remainingHints: number;
  onGetHint: () => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  remainingHints,
  onGetHint,
}) => {
  return (
    <div
      style={{
        background: '#fff7e6',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ffc069',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>提示 ({hints.length}/5)</strong>
        <button
          onClick={onGetHint}
          disabled={remainingHints === 0}
          style={{
            padding: '4px 12px',
            background: remainingHints > 0 ? '#fa8c16' : '#d9d9d9',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: remainingHints > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          获取提示
        </button>
      </div>
      {hints.map((hint, index) => (
        <div
          key={index}
          style={{
            background: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            marginBottom: '4px',
            fontSize: '14px',
          }}
        >
          {hint.label}: {hint.value}
        </div>
      ))}
      {hints.length === 0 && <div style={{ color: '#888', fontSize: '13px' }}>点击按钮获取提示</div>}
    </div>
  );
};


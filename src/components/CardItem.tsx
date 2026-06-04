import React from 'react';
import type { Card } from '../types';

interface CardItemProps {
  card: Card;
  onClick?: () => void;
  compact?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onClick, compact }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: compact ? 160 : 180,
        height: compact ? 232 : 261,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        // boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          // e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          // e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      {card.image ? (
        <img
          src={card.image}
          alt={card.name}
          loading="lazy"
          decoding="async"
          // 视口外的图片延后加载；decoding=async 避免阻塞首屏绘制
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div style={{ color: '#666', fontSize: 12 }}>无图</div>
      )}
    </div>
  );
};


import React from 'react';
import { Card } from '../types';
import { METADATA } from '../data/metadata';

interface CardItemProps {
  card: Card;
  onClick: () => void;
}

export const CardItem: React.FC<CardItemProps> = ({ card, onClick }) => {
  const className = METADATA.classes[card.class_id] || '未知';
  const rarityName = METADATA.rarities[card.rarity_id] || '未知';
  const minionTypeName = card.minion_type_id > 0 ? METADATA.minionTypes[card.minion_type_id] || '未知' : '无';

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        border: '1px solid #e0e0e0',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{card.name}</strong>
        <span style={{ color: '#1890ff' }}>{card.mana_cost}费</span>
      </div>
      {card.image && (
        <img
          src={card.image}
          alt={card.name}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '4px',
            maxHeight: '200px',
            objectFit: 'contain',
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
        <span style={{ color: '#52c41a' }}>攻: {card.attack || 0}</span>
        <span style={{ color: '#f5222d' }}>血: {card.health}</span>
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div>职业: {className}</div>
        <div>种族: {minionTypeName}</div>
        <div>稀有度: {rarityName}</div>
      </div>
    </div>
  );
};



import React from 'react';
import { CardItem } from './CardItem';
import { MatchTag } from './MatchTag';
import { GuessResult } from '../types';
import { METADATA } from '../data/metadata';

interface GuessHistoryProps {
  guesses: GuessResult[];
}

export const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flex: 1,
        overflowY: 'auto',
      }}
    >
      {guesses.map((guess, index) => (
        <div
          key={guess.card.id}
          style={{
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>#{index + 1}</span>
            <span
              style={{
                background: guess.matchCount === 8 ? '#52c41a' : '#1890ff',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              匹配: {guess.matchCount}/8
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            <MatchTag label={`费用${guess.card.mana_cost}`} match={guess.details.mana_cost} />
            <MatchTag label={`攻${guess.card.attack || 0}`} match={guess.details.attack} />
            <MatchTag label={`血${guess.card.health}`} match={guess.details.health} />
            <MatchTag
              label={METADATA.classes[guess.card.class_id] || '未知'}
              match={guess.details.class_id}
            />
            {guess.card.minion_type_id > 0 && (
              <MatchTag
                label={METADATA.minionTypes[guess.card.minion_type_id] || '未知'}
                match={guess.details.minion_type_id}
              />
            )}
            <MatchTag
              label={METADATA.rarities[guess.card.rarity_id] || '未知'}
              match={guess.details.rarity_id}
            />
          </div>
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%' }}>
            <CardItem card={guess.card} onClick={() => {}} />
          </div>
        </div>
      ))}
      {guesses.length === 0 && (
        <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>还没有猜测</div>
      )}
    </div>
  );
};


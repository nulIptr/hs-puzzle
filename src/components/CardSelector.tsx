
import React from 'react';
import { CardItem } from './CardItem';
import { MatchTag } from './MatchTag';
import { Card, GuessResult, FilterState } from '../types';
import { MINION_CARDS, getUniqueCosts, getUniqueClasses, getUniqueMinionTypes, getUniqueRarities } from '../data';
import { METADATA } from '../data/metadata';
import { SelectFilter } from './SelectFilter';

interface CardSelectorProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onCardSelect: (card: Card) => void;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  filter,
  setFilter,
  onCardSelect,
}) => {
  const filteredCards = React.useMemo(() => {
    return MINION_CARDS.filter((card) => {
      if (filter.mana_cost !== null && card.mana_cost !== filter.mana_cost) return false;
      if (filter.class_id !== null && card.class_id !== filter.class_id) return false;
      if (filter.minion_type_id !== null && card.minion_type_id !== filter.minion_type_id) return false;
      if (filter.rarity_id !== null && card.rarity_id !== filter.rarity_id) return false;
      return true;
    });
  }, [filter]);

  const uniqueCosts = React.useMemo(() => getUniqueCosts(), []);
  const uniqueClasses = React.useMemo(() => getUniqueClasses(), []);
  const uniqueMinionTypes = React.useMemo(() => getUniqueMinionTypes(), []);
  const uniqueRarities = React.useMemo(() => getUniqueRarities(), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div
        style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
        }}
      >
        <SelectFilter
          label="费用"
          value={filter.mana_cost}
          options={uniqueCosts.map((cost) => ({ value: cost, label: `${cost}费` }))}
          onChange={(v) => setFilter((prev) => ({ ...prev, mana_cost: v }))}
        />
        <SelectFilter
          label="职业"
          value={filter.class_id}
          options={uniqueClasses.map((id) => ({
            value: id,
            label: METADATA.classes[id] || String(id),
          }))}
          onChange={(v) => setFilter((prev) => ({ ...prev, class_id: v }))}
        />
        <SelectFilter
          label="种族"
          value={filter.minion_type_id}
          options={uniqueMinionTypes.map((id) => ({
            value: id,
            label: METADATA.minionTypes[id] || String(id),
          }))}
          onChange={(v) => setFilter((prev) => ({ ...prev, minion_type_id: v }))}
        />
        <SelectFilter
          label="稀有度"
          value={filter.rarity_id}
          options={uniqueRarities.map((id) => ({
            value: id,
            label: METADATA.rarities[id] || String(id),
          }))}
          onChange={(v) => setFilter((prev) => ({ ...prev, rarity_id: v }))}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
          alignContent: 'start',
        }}
      >
        {filteredCards.map((card) => (
          <CardItem key={card.id} card={card} onClick={() => onCardSelect(card)} />
        ))}
        {filteredCards.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666', padding: '40px' }}>
            没有找到匹配的卡牌
          </div>
        )}
      </div>
    </div>
  );
};


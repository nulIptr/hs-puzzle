
import type { Card } from '../types';
import {CARD} from './hs_cards_complete';

// 加载数据 - 暂时使用内联数据以避免JSON导入问题
const rawData = CARD;

export const MINION_CARDS: Card[] = (rawData.cards as Card[]).filter(
  (card) => card.card_type_id === 4 && card.collectible === 1
);

export const getCardById = (id: number): Card | undefined =>
  MINION_CARDS.find((card) => card.id === id);

export const getUniqueCosts = (): number[] => {
  const costs = new Set();
  MINION_CARDS.forEach((card) => costs.add(card.mana_cost));
  return Array.from(costs).sort((a, b) => a - b);
};

export const getUniqueClasses = (): number[] => {
  const classes = new Set();
  MINION_CARDS.forEach((card) => classes.add(card.class_id));
  return Array.from(classes).sort((a, b) => a - b);
};

export const getUniqueMinionTypes = (): number[] => {
  const types = new Set();
  MINION_CARDS.forEach((card) => {
    if (card.minion_type_id > 0) types.add(card.minion_type_id);
  });
  return Array.from(types).sort((a, b) => a - b);
};

export const getUniqueRarities = (): number[] => {
  const rarities = new Set();
  MINION_CARDS.forEach((card) => rarities.add(card.rarity_id));
  return Array.from(rarities).sort((a, b) => a - b);
};

export const getUniqueSets = (): number[] => {
  const sets = new Set();
  MINION_CARDS.forEach((card) => sets.add(card.card_set_id));
  return Array.from(sets).sort((a, b) => a - b);
};


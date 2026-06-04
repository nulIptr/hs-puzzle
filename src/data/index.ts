import type { Card, GameMode } from '../types';
import { loadCards, getCardsSync } from './metadata';

const _minionCardsCache: Record<GameMode, Card[] | null> = {
  standard: null,
  wild: null,
};
const _minionCardsPromise: Record<GameMode, Promise<Card[]> | null> = {
  standard: null,
  wild: null,
};

// 拆分后的 JSON 已经是「按模式的随从池」，
// 因此不再需要 SeriesInfo 在运行时再做一次 set 过滤。
const computeMinionCards = (cards: Card[]): Card[] => cards;

// 首次调用时按需加载指定模式的随从数据；后续调用走该模式自己的缓存。
export const loadMinionCards = (mode: GameMode = 'standard'): Promise<Card[]> => {
  if (_minionCardsCache[mode]) return Promise.resolve(_minionCardsCache[mode]!);
  if (!_minionCardsPromise[mode]) {
    _minionCardsPromise[mode] = loadCards(mode).then((cards) => {
      const minions = computeMinionCards(cards);
      _minionCardsCache[mode] = minions;
      return minions;
    });
  }
  return _minionCardsPromise[mode]!;
};

// 仅在指定模式的数据已就绪时返回随从数组；未加载完成时返回 null。
export const getMinionCardsSync = (mode: GameMode = 'standard'): Card[] | null =>
  _minionCardsCache[mode];

export const getPlayableCards = async (
  mode: GameMode = 'standard'
): Promise<Card[]> => loadMinionCards(mode);

export const getCardById = (id: number): Card | undefined =>
  getCardsSync('wild')?.find((card) => card.id === id);

export const getUniqueCosts = (): number[] => {
  const cards = getCardsSync('wild') ?? [];
  const costs = new Set<number>();
  cards.forEach((card) => costs.add(card.mana_cost));
  return Array.from(costs).sort((a, b) => a - b);
};

export const getUniqueClasses = (): string[] => {
  const cards = getCardsSync('wild') ?? [];
  const classes = new Set<string>();
  cards.forEach((card) => classes.add(card.class_id));
  return Array.from(classes).sort();
};

export const getUniqueMinionTypes = (): string[] => {
  const cards = getCardsSync('wild') ?? [];
  const types = new Set<string>();
  cards.forEach((card) => {
    if (card.minion_type_id) types.add(card.minion_type_id);
  });
  return Array.from(types).sort();
};

export const getUniqueRarities = (): string[] => {
  const cards = getCardsSync('wild') ?? [];
  const rarities = new Set<string>();
  cards.forEach((card) => rarities.add(card.rarity_id));
  return Array.from(rarities).sort();
};

export const getUniqueSets = (): number[] => {
  const cards = getCardsSync('wild') ?? [];
  const sets = new Set<number>();
  cards.forEach((card) => sets.add(card.card_set_id));
  return Array.from(sets).sort((a, b) => a - b);
};

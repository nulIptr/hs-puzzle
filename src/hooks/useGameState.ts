
import React, { useState, useCallback } from 'react';
import { Card, Hint, GuessResult, HintType } from '../types';
import { MINION_CARDS } from '../data';
import { METADATA } from '../data/metadata';

const MAX_HINTS = 5;
const MAX_GUESSES = 6;

const HINT_LABELS: Record<HintType, string> = {
  mana_cost: '费用',
  attack: '攻击力',
  health: '生命值',
  class_id: '职业',
  minion_type_id: '种族',
  card_set_id: '卡牌系列',
  rarity_id: '稀有度',
};

export const useGameState = () => {
  const [targetCard, setTargetCard] = useState<Card | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [remainingHints, setRemainingHints] = useState(MAX_HINTS);
  const [remainingGuesses, setRemainingGuesses] = useState(MAX_GUESSES);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const startNewGame = useCallback(() => {
    const randomCard = MINION_CARDS[Math.floor(Math.random() * MINION_CARDS.length)];
    setTargetCard(randomCard);
    setHints([]);
    setGuesses([]);
    setRemainingHints(MAX_HINTS);
    setRemainingGuesses(MAX_GUESSES);
    setGameOver(false);
    setWon(false);
  }, []);

  React.useEffect(() => {
    if (MINION_CARDS.length > 0) {
      startNewGame();
    }
  }, [startNewGame]);

  const getHint = useCallback(() => {
    if (!targetCard || remainingHints <= 0) return;

    const usedHintTypes = new Set(hints.map((h) => h.type));
    const availableTypes: HintType[] = [];

    for (const type of Object.keys(HINT_LABELS) as HintType[]) {
      if (!usedHintTypes.has(type)) {
        availableTypes.push(type);
      }
    }

    if (availableTypes.length === 0) return;

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    let value: string | number;

    switch (randomType) {
      case 'mana_cost':
        value = targetCard.mana_cost;
        break;
      case 'attack':
        value = targetCard.attack || 0;
        break;
      case 'health':
        value = targetCard.health;
        break;
      case 'class_id':
        value = METADATA.classes[targetCard.class_id] || '未知';
        break;
      case 'minion_type_id':
        value = targetCard.minion_type_id > 0 ? METADATA.minionTypes[targetCard.minion_type_id] || '未知' : '无';
        break;
      case 'card_set_id':
        value = targetCard.card_set_id;
        break;
      case 'rarity_id':
        value = METADATA.rarities[targetCard.rarity_id] || '未知';
        break;
    }

    setHints((prev) => [...prev, { type: randomType, label: HINT_LABELS[randomType], value }]);
    setRemainingHints((prev) => prev - 1);
  }, [targetCard, hints, remainingHints]);

  const makeGuess = useCallback(
    (card: Card) => {
      if (!targetCard || gameOver || remainingGuesses <= 0) return;

      const details = {
        mana_cost: card.mana_cost === targetCard.mana_cost,
        attack: (card.attack || 0) === (targetCard.attack || 0),
        health: card.health === targetCard.health,
        class_id: card.class_id === targetCard.class_id,
        minion_type_id: card.minion_type_id === targetCard.minion_type_id,
        card_set_id: card.card_set_id === targetCard.card_set_id,
        rarity_id: card.rarity_id === targetCard.rarity_id,
        keyword_ids: JSON.stringify(card.keyword_ids?.sort() || []) === JSON.stringify(targetCard.keyword_ids?.sort() || []),
      };

      const matchCount = Object.values(details).filter(Boolean).length;
      const isCorrect = card.id === targetCard.id;

      const newGuess: GuessResult = { card, matchCount, details };
      setGuesses((prev) => [...prev, newGuess]);
      setRemainingGuesses((prev) => prev - 1);

      if (isCorrect) {
        setGameOver(true);
        setWon(true);
      } else if (remainingGuesses <= 1) {
        setGameOver(true);
        setWon(false);
      }
    },
    [targetCard, gameOver, remainingGuesses]
  );

  return {
    targetCard,
    hints,
    guesses,
    remainingHints,
    remainingGuesses,
    gameOver,
    won,
    startNewGame,
    getHint,
    makeGuess,
  };
};


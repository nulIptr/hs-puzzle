import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Card, Hint, GuessResult, HintType, RoundResult, GameMode } from '../types';
import { getMinionCardsSync } from '../data';
import { Classes, MinionTypes, Rarities, Series } from '../data/metadata';

const ROUNDS_PER_GAME = 5;
const BASE_SCORE_PER_ROUND = 1000;
const GUESS_PENALTY = 50;
const HINT_PENALTY = 80;
const CELEBRATION_MS = 1800;
const FEEDBACK_MS = 2500;

export const HINT_TYPES: HintType[] = [
  'mana_cost',
  'attack',
  'health',
  'class_id',
  'minion_type_id',
  'card_set_id',
  'rarity_id',
];

const HINT_LABELS: Record<HintType, string> = {
  mana_cost: '费用',
  attack: '攻击力',
  health: '生命值',
  class_id: '职业',
  minion_type_id: '种族',
  card_set_id: '卡牌系列',
  rarity_id: '稀有度',
};

const pickRandomCards = (pool: Card[], count: number): Card[] => {
  const copy = [...pool];
  const picked: Card[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
};

const makeId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const calculateRoundScore = (hintCount: number, guessCount: number): number => {
  return Math.max(0, BASE_SCORE_PER_ROUND - hintCount * HINT_PENALTY - guessCount * GUESS_PENALTY);
};

export type FeedbackTone = 'info' | 'success' | 'error';

export interface Feedback {
  id: string;
  tone: FeedbackTone;
  message: string;
}

export interface SolvedCelebration {
  card: Card;
  hintCount: number;
  guessCount: number;
  roundIndex: number;
  isLastRound: boolean;
}

export type GuessOutcome = 'recorded' | 'duplicate' | 'correct' | 'solved';

export const useGameState = (playableCards: Card[] = getMinionCardsSync() ?? [], gameMode: GameMode = 'standard') => {
  const [targets, setTargets] = useState<Card[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [hints, setHints] = useState<Hint[]>([]);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [abandoned, setAbandoned] = useState(false);
  const [usedCardIds, setUsedCardIds] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [solved, setSolved] = useState<SolvedCelebration | null>(null);

  const targetCard = targets[currentRound] ?? null;

  const totalHints = roundResults.reduce((sum, r) => sum + r.hintCount, 0) + hints.length;
  const totalGuesses = roundResults.reduce((sum, r) => sum + r.guessCount, 0) + guesses.length;
  const completedRounds = roundResults.length;
  const maxHintTypes = HINT_TYPES.length;
  const remainingHints = maxHintTypes - hints.length;

  const showFeedback = useCallback((tone: FeedbackTone, message: string) => {
    setFeedback({ id: makeId(), tone, message });
  }, []);

  // Auto-clear feedback
  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => {
      setFeedback((cur) => (cur && cur.id === feedback.id ? null : cur));
    }, FEEDBACK_MS);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const startNewGame = useCallback(() => {
    if (playableCards.length === 0) return;
    const picked = pickRandomCards(playableCards, ROUNDS_PER_GAME);
    if (picked.length === 0) return;
    setTargets(picked);
    setUsedCardIds(new Set(picked.map((c) => c.id)));
    setCurrentRound(0);
    setHints([]);
    setGuesses([]);
    setRoundResults([]);
    setGameOver(false);
    setFinalScore(0);
    setAbandoned(false);
    setSolved(null);
    setFeedback(null);
  }, [playableCards]);

  const prevPlayableCardsRef = React.useRef<Card[] | null>(null);
  useEffect(() => {
    if (playableCards.length === 0) return;
    if (prevPlayableCardsRef.current !== playableCards) {
      prevPlayableCardsRef.current = playableCards;
      startNewGame();
    }
  }, [playableCards, startNewGame]);

  const getHint = useCallback(() => {
    if (!targetCard || gameOver || solved) return;

    // 已被猜测确定的属性（至少一次匹配），再给提示无意义
    const determinedTypes = new Set<HintType>();
    for (const g of guesses) {
      if (g.details.mana_cost) determinedTypes.add('mana_cost');
      if (g.details.attack) determinedTypes.add('attack');
      if (g.details.health) determinedTypes.add('health');
      if (g.details.class_id) determinedTypes.add('class_id');
      if (g.details.minion_type_id) determinedTypes.add('minion_type_id');
      if (g.details.card_set_id) determinedTypes.add('card_set_id');
      if (g.details.rarity_id) determinedTypes.add('rarity_id');
    }

    const usedHintTypes = new Set(hints.map((h) => h.type));
    const availableTypes: HintType[] = HINT_TYPES.filter(
      (t) => !usedHintTypes.has(t) && !determinedTypes.has(t)
    );

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
        value = Classes[targetCard.class_id as keyof typeof Classes] || targetCard.class_id;
        break;
      case 'minion_type_id':
        value = targetCard.minion_type_id
          ? (MinionTypes[targetCard.minion_type_id as keyof typeof MinionTypes] || targetCard.minion_type_id)
          : '无';
        break;
      case 'card_set_id':
        value = Series[String(targetCard.card_set_id) as keyof typeof Series] || targetCard.card_set_id;
        break;
      case 'rarity_id':
        value = Rarities[targetCard.rarity_id as keyof typeof Rarities] || targetCard.rarity_id;
        break;
    }

    setHints((prev) => [...prev, { type: randomType, label: HINT_LABELS[randomType], value }]);
  }, [targetCard, hints, guesses, gameOver, solved]);

  const finalizeRound = useCallback(
    (card: Card, hintCount: number, guessCount: number) => {
      // 关键：所有 setState 调用必须放在 setRoundResults 的 updater 之外，
      // 否则 React StrictMode 会让 updater 运行两次，导致 setCurrentRound 触发两次。
      const isLastRound = currentRound >= targets.length - 1;
      const nextResults: RoundResult[] = [
        ...roundResults,
        { card, hintCount, guessCount },
      ];

      setRoundResults(nextResults);
      setHints([]);
      setGuesses([]);

      if (isLastRound) {
        const score = nextResults.reduce(
          (sum, r) => sum + calculateRoundScore(r.hintCount, r.guessCount),
          0
        );
        setFinalScore(score);
        setGameOver(true);
      } else {
        setCurrentRound((r) => r + 1);
      }
    },
    [currentRound, targets.length, roundResults]
  );

  const makeGuess = useCallback(
    (card: Card): GuessOutcome => {
      if (!targetCard || gameOver || solved) return 'solved';

      // Duplicate guard
      if (guesses.some((g) => g.card.id === card.id)) {
        showFeedback('info', `「${card.name}」已经被排除过了，不能重复猜测`);
        return 'duplicate';
      }

      const details = {
        mana_cost: card.mana_cost === targetCard.mana_cost,
        attack: (card.attack || 0) === (targetCard.attack || 0),
        health: card.health === targetCard.health,
        class_id: card.class_id === targetCard.class_id,
        minion_type_id: card.minion_type_id === targetCard.minion_type_id,
        card_set_id: card.card_set_id === targetCard.card_set_id,
        rarity_id: card.rarity_id === targetCard.rarity_id,
        keyword_ids:
          JSON.stringify(card.keyword_ids?.sort() || []) ===
          JSON.stringify(targetCard.keyword_ids?.sort() || []),
      };

      const matchCount = Object.values(details).filter(Boolean).length;
      const isCorrect = card.id === targetCard.id;

      const newGuess: GuessResult = { id: makeId(), card, matchCount, details };
      setGuesses((prev) => [...prev, newGuess]);

      if (!isCorrect) {
        showFeedback('info', `「${card.name}」不是目标卡牌（匹配 ${matchCount}/7）`);
        return 'recorded';
      }

      // Correct! Show celebration first, then advance
      const isLastRound = currentRound >= targets.length - 1;
      setSolved({
        card: targetCard,
        hintCount: hints.length,
        guessCount: guesses.length + 1,
        roundIndex: currentRound,
        isLastRound,
      });
      showFeedback('success', `猜对了！这就是「${targetCard.name}」`);
      return 'correct';
    },
    [targetCard, gameOver, solved, guesses, hints, currentRound, targets.length, showFeedback]
  );

  // After celebration delay, finalize the round
  const finalizeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!solved) return;
    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = window.setTimeout(() => {
      const { card, hintCount, guessCount } = solved;
      setSolved(null);
      finalizeRound(card, hintCount, guessCount);
    }, CELEBRATION_MS);
    return () => {
      if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    };
  }, [solved, finalizeRound]);

  // 放弃本局：整局游戏（5 轮）作废，已完成的轮次按 0 分计入，
  // 未完成的轮次补成 0 提示/0 猜测的 0 分条目，方便在结算界面看到剩余卡牌。
  // 放弃后 finalScore 直接置 0，不参与"已完成轮次实际得分"的计算，
  // 避免未完成轮次按 0 提示/0 猜测被算成 1000 分造成"满分假象"。
  const abandonGame = useCallback(() => {
    if (gameOver) return;
    const abandoned: RoundResult[] = [
      ...roundResults,
      ...targets.slice(currentRound).map<RoundResult>((card) => ({
        card,
        hintCount: 0,
        guessCount: 0,
      })),
    ];
    setRoundResults(abandoned);
    setFinalScore(0);
    setAbandoned(true);
    setGameOver(true);
    setSolved(null);
    setFeedback({
      id: makeId(),
      tone: 'error',
      message: '已放弃本局游戏',
    });
  }, [gameOver, roundResults, targets, currentRound]);

  return {
    targetCard,
    targets,
    currentRound,
    totalRounds: ROUNDS_PER_GAME,
    hints,
    guesses,
    remainingHints,
    maxHintTypes,
    gameOver,
    won: gameOver,
    finalScore,
    abandoned,
    totalHints,
    totalGuesses,
    completedRounds,
    roundResults,
    gameMode,
    usedCardIds,
    feedback,
    solved,
    startNewGame,
    getHint,
    makeGuess,
    abandonGame,
  };
};

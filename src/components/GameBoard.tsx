
import React from 'react';
import { useGameState } from '../hooks/useGameState';
import { useFilteredCards } from '../hooks/useFilteredCards';
import { CardSelector } from './CardSelector';
import { GuessHistory } from './GuessHistory';
import { HintPanel } from './HintPanel';
import { GameOverModal } from './GameOverModal';
import { Card } from '../types';
import { MINION_CARDS } from '../data';

export const GameBoard: React.FC = () => {
  const {
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
  } = useGameState();
  const { filter, setFilter } = useFilteredCards();

  const handleCardSelect = React.useCallback(
    (card: Card) => {
      if (!gameOver && remainingGuesses > 0) {
        makeGuess(card);
      }
    },
    [gameOver, remainingGuesses, makeGuess]
  );

  if (MINION_CARDS.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        加载卡牌数据中...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          width: '400px',
          background: '#fff',
          borderRight: '1px solid #e8e8e8',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>🎴 炉石猜卡牌</h1>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              提示: <strong style={{ color: '#fa8c16' }}>{remainingHints}</strong>
            </span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              机会: <strong style={{ color: '#1890ff' }}>{remainingGuesses}</strong>
            </span>
            <button
              onClick={startNewGame}
              style={{
                padding: '4px 12px',
                background: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              新游戏
            </button>
          </div>
        </div>

        <HintPanel
          hints={hints}
          remainingHints={remainingHints}
          onGetHint={getHint}
        />

        <GuessHistory guesses={guesses} />
      </div>

      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        <CardSelector
          filter={filter}
          setFilter={setFilter}
          onCardSelect={handleCardSelect}
        />
      </div>

      <GameOverModal
        isOpen={gameOver}
        won={won}
        targetCard={targetCard}
        onRestart={startNewGame}
      />
    </div>
  );
};


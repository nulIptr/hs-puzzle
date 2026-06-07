
import React from 'react';
import { CardItem } from './CardItem';
import { MatchTag } from './MatchTag';
import type { GuessResult } from '../types';
import { Classes, MinionTypes, Rarities } from '../data/metadata';

interface GuessHistoryProps {
  guesses: GuessResult[];
  excludedCardIds?: number[];
  compact?: boolean;
}

const MIN_THUMB = 48;

export const GuessHistory: React.FC<GuessHistoryProps> = ({
  guesses,
  excludedCardIds = [],
  compact = false,
}) => {
  const excludedSet = React.useMemo(() => new Set(excludedCardIds), [excludedCardIds]);

  // 移动端：每个猜测用一张小卡 + 评分 + 简短描述，避免横向滚动
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <strong style={{ color: '#ffd966', fontSize: 13 }}>猜测历史</strong>
          <span style={{ color: '#a08a6a', fontSize: 11 }}>
            共 <strong style={{ color: '#ffd966' }}>{guesses.length}</strong> 次
          </span>
        </div>
        {guesses.map((guess, index) => {
          const excluded = excludedSet.has(guess.card.id);
          return (
            <div
              key={guess.id}
              style={{
                background: 'rgba(0,0,0,0.35)',
                padding: 6,
                borderRadius: 6,
                border: excluded ? '1px solid #7a1a1a' : '1px solid #5a3a1a',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                opacity: excluded ? 0.55 : 1,
              }}
              title={excluded ? '这张卡片已被排除' : undefined}
            >
              {/* 小缩略图 */}
              <div
                style={{
                  position: 'relative',
                  width: MIN_THUMB,
                  height: Math.round((MIN_THUMB * 232) / 160),
                  flexShrink: 0,
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: '#1a1208',
                }}
              >
                {guess.card.image && (
                  <img
                    src={guess.card.image}
                    alt={guess.card.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                {excluded && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(196,48,43,0.92)',
                      color: 'white',
                      padding: '0 4px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    已排除
                  </div>
                )}
              </div>
              {/* 名称 + 评分 */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: '#f4e4bc',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    #{index + 1} {guess.card.name}
                  </span>
                  <span
                    style={{
                      background:
                        guess.matchCount >= 6
                          ? 'linear-gradient(to bottom, #5fb24a, #3e8a2c)'
                          : guess.matchCount >= 3
                          ? 'linear-gradient(to bottom, #4ea8ff, #1e5fb8)'
                          : 'linear-gradient(to bottom, #c4302b, #7a1a1a)',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      border: '1px solid #1a1208',
                      textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {guess.matchCount}/7
                  </span>
                </div>
                <div
                  style={{
                    color: '#a08a6a',
                    fontSize: 10,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {guess.card.mana_cost}费 · 攻{guess.card.attack || 0} · 血{guess.card.health} ·{' '}
                  {Classes[guess.card.class_id as keyof typeof Classes] || guess.card.class_id}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                  <MatchTag label={`费${guess.card.mana_cost}`} match={guess.details.mana_cost} />
                  <MatchTag label={`攻${guess.card.attack || 0}`} match={guess.details.attack} />
                  <MatchTag label={`血${guess.card.health}`} match={guess.details.health} />
                  <MatchTag
                    label={Classes[guess.card.class_id as keyof typeof Classes] || guess.card.class_id}
                    match={guess.details.class_id}
                  />
                  {guess.card.minion_type_id && (
                    <MatchTag
                      label={MinionTypes[guess.card.minion_type_id as keyof typeof MinionTypes] || guess.card.minion_type_id}
                      match={guess.details.minion_type_id}
                    />
                  )}
                  <MatchTag
                    label={Rarities[guess.card.rarity_id as keyof typeof Rarities] || guess.card.rarity_id}
                    match={guess.details.rarity_id}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {guesses.length === 0 && (
          <div
            style={{
              color: '#a08a6a',
              textAlign: 'center',
              padding: 12,
              fontSize: 12,
            }}
          >
            还没有猜测
          </div>
        )}
      </div>
    );
  }

  // 桌面端：原版（包含完整 MatchTag 列表）
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: 2,
      }}
    >
      <strong style={{ color: '#ffd966', fontSize: 13 }}>猜测历史</strong>
      {guesses.map((guess, index) => {
        const excluded = excludedSet.has(guess.card.id);
        return (
          <div
            key={guess.id}
            style={{
              background: 'rgba(0,0,0,0.35)',
              padding: 8,
              borderRadius: 6,
              border: excluded ? '1px solid #7a1a1a' : '1px solid #5a3a1a',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              opacity: excluded ? 0.55 : 1,
            }}
            title={excluded ? '这张卡片已被排除' : undefined}
          >
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <CardItem card={guess.card} compact onClick={() => {}} />
              {excluded && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(196,48,43,0.92)',
                    color: 'white',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  已排除
                </div>
              )}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontWeight: 'bold',
                    color: '#f4e4bc',
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{index + 1} {guess.card.name}
                </span>
                <span
                  style={{
                    background:
                      guess.matchCount >= 6
                        ? 'linear-gradient(to bottom, #5fb24a, #3e8a2c)'
                        : guess.matchCount >= 3
                        ? 'linear-gradient(to bottom, #4ea8ff, #1e5fb8)'
                        : 'linear-gradient(to bottom, #c4302b, #7a1a1a)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid #1a1208',
                    textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                    flexShrink: 0,
                    marginLeft: 6,
                  }}
                >
                  {guess.matchCount}/7
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <MatchTag label={`费用${guess.card.mana_cost}`} match={guess.details.mana_cost} />
                <MatchTag label={`攻${guess.card.attack || 0}`} match={guess.details.attack} />
                <MatchTag label={`血${guess.card.health}`} match={guess.details.health} />
                <MatchTag
                  label={Classes[guess.card.class_id as keyof typeof Classes] || guess.card.class_id}
                  match={guess.details.class_id}
                />
                {guess.card.minion_type_id && (
                  <MatchTag
                    label={MinionTypes[guess.card.minion_type_id as keyof typeof MinionTypes] || guess.card.minion_type_id}
                    match={guess.details.minion_type_id}
                  />
                )}
                <MatchTag
                  label={Rarities[guess.card.rarity_id as keyof typeof Rarities] || guess.card.rarity_id}
                  match={guess.details.rarity_id}
                />
              </div>
            </div>
          </div>
        );
      })}
      {guesses.length === 0 && (
        <div
          style={{
            color: '#a08a6a',
            textAlign: 'center',
            padding: 12,
            fontSize: 12,
          }}
        >
          还没有猜测
        </div>
      )}
    </div>
  );
};

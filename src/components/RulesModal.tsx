import React, { useEffect, useState } from 'react';
import { CardItem } from './CardItem';
import type { Card } from '../types';
import { getPlayableCards } from '../data';

export interface RulesSection {
    emoji: string;
    title: string;
    body: React.ReactNode;
}

// 与 useGameState.ts 中 BASE_SCORE_PER_ROUND / HINT_PENALTY / GUESS_PENALTY 保持一致
const BASE_SCORE = 1000;
const HINT_COST = 80;
const GUESS_COST = 50;



export const RULES_SECTIONS: RulesSection[] = [
    {
        emoji: '🎯',
        title: '游戏目标',
        body: (
            <>
                <p style={{ margin: '0 0 6px 0' }}>
                    每局游戏包含 <strong style={{ color: '#ffd966' }}>5 轮</strong>。
                    系统会从当前模式的随从池中随机抽 1 张作为<strong>谜底</strong>，
                    通过不断获取提示 + 猜测来锁定它。
                </p>
                <p style={{ margin: 0 }}>
                    5 轮全部猜中即通关，最终得分 = 5 轮得分之和。
                </p>
            </>
        ),
    },
    {
        emoji: '🔎',
        title: '提示系统（最多 7 条 / 轮）',
        body: (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                <li>每轮共有 <strong>7 类</strong>提示：费用 / 攻击力 / 生命值 / 职业 / 种族 / 卡牌系列 / 稀有度</li>
                <li>每类只能揭示一次，揭示后会显示谜底在该维度的具体值</li>
                <li>同时右侧已揭示的维度会<strong>变灰</strong>，避免重复扣分</li>
            </ul>
        ),
    },
    {
        emoji: '🎲',
        title: '猜测机制',
        body: (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                <li>点击候选区任意卡牌即可猜测，猜错会显示与谜底的<strong>匹配度 X/7</strong></li>
                <li>同一张卡牌已被猜过后再点，会提示「已被排除，不能重复猜测」且<strong>不再计入</strong>猜测次数</li>
                <li>猜对后会先展示 1.8 秒庆祝面板，再自动进入下一轮</li>
            </ul>
        ),
    },
    {
        emoji: '💯',
        title: '计分规则',
        body: (
            <>
                <p style={{ margin: '0 0 6px 0' }}>
                    每轮满分 <strong style={{ color: '#ffd966' }}>{BASE_SCORE}</strong>：
                </p>
                <p style={{ margin: '0 0 6px 0', fontFamily: 'monospace', background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: 4 }}>
                    轮次得分 = max(0, {BASE_SCORE} - 提示数×{HINT_COST} - 猜测数×{GUESS_COST})
                </p>
                <p style={{ margin: 0 }}>
                    评级：≥4500 S · ≥3500 A · ≥2500 B · ≥1500 C · 其余 D
                </p>
            </>
        ),
    },
    {
        emoji: '🏳️',
        title: '放弃本局',
        body: (
            <p style={{ margin: 0 }}>
                点击「放弃本局」会弹窗二次确认。
                确认后<strong style={{ color: '#ff7a73' }}>整局 5 轮全部作废</strong>，
                最终得分记为 <strong>0</strong>，不再按 1000 分/轮计算。
                可在「再来一局」开启新游戏。
            </p>
        ),
    },
    {
        emoji: '🃏',
        title: '游戏模式',
        body: (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                <li><strong>标准</strong>：仅使用当前标准系列的随从</li>
                <li><strong>狂野</strong>：使用全部随从，难度更高</li>
                <li>切换模式会开启新一局，进度清零</li>
            </ul>
        ),
    },
    {
        emoji: '📜',
        title: '历史记录',
        body: (
            <p style={{ margin: 0 }}>
                顶部「历史」按钮可查看本局实时动作（提示 / 猜测 / 当前轮次）以及历史通关记录。
            </p>
        ),
    },
];

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart?: () => void;
    showSampleCard?: boolean;
}

export const RulesModal: React.FC<RulesModalProps> = ({
    isOpen,
    onClose,
    onStart,
    showSampleCard = false,
}) => {
    const [sampleCard, setSampleCard] = useState<Card | null>(null);

    useEffect(() => {
        if (!isOpen || !showSampleCard) return;
        let cancelled = false;
        getPlayableCards('standard').then((cards) => {
            if (cancelled) return;
            setSampleCard(cards[0] ?? null);
        });
        return () => {
            cancelled = true;
        };
    }, [isOpen, showSampleCard]);

    if (!isOpen) return null;
    const SAMPLE_CARD: Card | null = sampleCard;
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1020,
                animation: 'hs-fade-in 0.18s ease-out',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
                    border: '2px solid #5fb24a',
                    borderRadius: 12,
                    padding: '20px 26px',
                    minWidth: 360,
                    maxWidth: 560,
                    width: '92%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    color: '#f4e4bc',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 24px rgba(95,178,74,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    animation: 'hs-pop-in 0.22s ease-out',
                }}
            >
                <div
                    id="rules-title"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 18,
                        fontWeight: 800,
                        color: '#ffd966',
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                >
                    <span style={{ fontSize: 22 }}>📖</span>
                    游戏规则 · 如何玩
                </div>

                <div
                    style={{
                        background: 'rgba(95,178,74,0.1)',
                        border: '1px solid rgba(95,178,74,0.4)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: '#d9f0c8',
                    }}
                >
                    一局游戏 = 5 轮猜卡。每轮随机谜底 + 7 类提示 + 任意次猜测。
                    提示越少、猜测越少，分数越高。
                </div>

                {showSampleCard && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid #5a3a1a',
                            borderRadius: 6,
                            padding: 10,
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            {SAMPLE_CARD && (
                                <CardItem card={SAMPLE_CARD} onClick={() => { }} compact />
                            )}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#a08a6a' }}>
                            比如这张「示例卡牌」：费用 4、攻击 3、血 4 → 点击卡牌可作为猜测对象；
                            点击顶部「提示」按钮可逐项揭示谜底属性。
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        fontSize: 13,
                        color: '#f4e4bc',
                    }}
                >
                    {RULES_SECTIONS.map((s) => (
                        <div
                            key={s.title}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #5a3a1a',
                                borderRadius: 6,
                                padding: '10px 14px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#ffd966',
                                    marginBottom: 6,
                                }}
                            >
                                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                                {s.title}
                            </div>
                            {s.body}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    {onStart && (
                        <button
                            onClick={() => {
                                onClose();
                                onStart();
                            }}
                            style={{
                                padding: '6px 18px',
                                background: 'transparent',
                                color: '#f4e4bc',
                                border: '1px solid #5a3a1a',
                                borderRadius: 14,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            开始游戏
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 26px',
                            background: 'linear-gradient(to bottom, #5fb24a, #3e8a2c)',
                            color: 'white',
                            border: '1px solid #2d661e',
                            borderRadius: 14,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 700,
                            textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                        }}
                    >
                        {onStart ? '我知道了' : '关闭'}
                    </button>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { CardItem } from './CardItem';
import type { Card, FilterState, Hint, GuessResult } from '../types';
import { Classes, MinionTypes, Rarities, Series } from '../data/metadata';
import { SelectFilter } from './SelectFilter';
import { useIsMobile } from '../hooks/useIsMobile';

interface CardSelectorProps {
  cards: Card[];
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onCardSelect: (card: Card) => void;
  hints: Hint[];
  guesses: GuessResult[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

const chipBase: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 14,
  fontSize: 13,
  cursor: 'pointer',
  border: '1px solid #5a3a1a',
  background: 'linear-gradient(to bottom, #4a3320, #2a1f17)',
  color: '#f4e4bc',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

const chipActive: React.CSSProperties = {
  ...chipBase,
  background: 'linear-gradient(to bottom, #6b4a2a, #4a3320)',
  color: '#ffd966',
  boxShadow: 'inset 0 0 0 1px #ffd966, 0 0 6px rgba(255,217,102,0.3)',
};

const manaChipBase: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  border: '1px solid #2a1f17',
  background: 'radial-gradient(circle at 30% 30%, #5a4a30, #2a1f17)',
  color: '#f4e4bc',
  userSelect: 'none',
};

const manaChipActive: React.CSSProperties = {
  ...manaChipBase,
  background: 'radial-gradient(circle at 30% 30%, #ffd966, #b87a2a)',
  color: '#1a1208',
  border: '1px solid #ffd966',
  boxShadow: '0 0 6px rgba(255,217,102,0.6)',
};

const filterBarLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#ffd966',
  letterSpacing: 1,
  padding: '0 4px',
  flexShrink: 0,
};

const autoFilterBtn: React.CSSProperties = {
  padding: '4px 14px',
  background: 'linear-gradient(to bottom, #4ea8ff, #1e5fb8)',
  color: 'white',
  border: '1px solid #1a1208',
  borderRadius: 14,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  textShadow: '0 1px 1px rgba(0,0,0,0.3)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
};

export const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  filter,
  setFilter,
  onCardSelect,
  hints,
  guesses,
  search,
  setSearch,
}) => {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // 移动端打开筛选弹窗时，如果面板之前是折叠的则自动展开
  React.useEffect(() => {
    if (mobileFilterOpen && !advancedOpen) {
      setAdvancedOpen(true);
    }
  }, [mobileFilterOpen, advancedOpen]);

  const filteredCards = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      if (filter.mana_cost !== null && card.mana_cost !== filter.mana_cost) return false;
      if (filter.class_id !== null && card.class_id !== filter.class_id) return false;
      // 种族支持复合标签（如"野兽,龙"），用子串包含匹配
      if (
        filter.minion_type_id !== null &&
        !(card.minion_type_id || '').split(/[,，、\s]+/).includes(filter.minion_type_id)
      ) {
        return false;
      }
      if (filter.rarity_id !== null && card.rarity_id !== filter.rarity_id) return false;
      if (filter.attack !== null && (card.attack || 0) !== filter.attack) return false;
      if (filter.health !== null && card.health !== filter.health) return false;
      if (filter.card_set_id !== null && card.card_set_id !== filter.card_set_id) return false;
      if (filter.excluded_mana_costs.includes(card.mana_cost)) return false;
      if (filter.excluded_class_ids.includes(card.class_id)) return false;
      if (filter.excluded_minion_type_ids.length > 0) {
        const cardTypes = (card.minion_type_id || '').split(/[,，、\s]+/).filter(Boolean);
        if (filter.excluded_minion_type_ids.some((t) => cardTypes.includes(t))) {
          return false;
        }
      }
      if (filter.excluded_rarity_ids.includes(card.rarity_id)) return false;
      if (filter.excluded_attacks.includes(card.attack || 0)) return false;
      if (filter.excluded_healths.includes(card.health)) return false;
      if (filter.excluded_card_set_ids.includes(card.card_set_id)) return false;
      if (q && !card.name.toLowerCase().includes(q) && !card.text.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [filter, search]);

  const uniqueCosts = React.useMemo(
    () => Array.from(new Set(cards.map((c) => c.mana_cost))).sort((a, b) => a - b),
    [cards]
  );
  const classIds = React.useMemo(
    // 职业按钮固定取自 Classes 字典的 12 个职业键，
    // 既不被 .slice(0, 8) 截断，也不会因为某个职业在当前模式下没有卡牌而消失。
    () => Object.keys(Classes) as Array<keyof typeof Classes>,
    []
  );
  const uniqueMinionTypes = React.useMemo(
    // 种族选项固定取自 MinionTypes 字典的原子键（去除"全部"），
    // 避免卡牌数据中可能存在的"野兽,龙"等复合标签污染下拉选项。
    () =>
      (Object.keys(MinionTypes) as Array<keyof typeof MinionTypes>).filter(
        (k) => k !== '全部'
      ),
    []
  );
  const uniqueRarities = React.useMemo(
    () => Array.from(new Set(cards.map((c) => c.rarity_id))).sort(),
    [cards]
  );
  const uniqueSets = React.useMemo(
    () => Array.from(new Set(cards.map((c) => c.card_set_id))).sort((a, b) => a - b),
    [cards]
  );

  const canAutoFilter = hints.length > 0 || guesses.length > 0;

  const handleAutoFilter = React.useCallback(() => {
    const newFilter: FilterState = {
      mana_cost: null,
      class_id: null,
      minion_type_id: null,
      rarity_id: null,
      card_set_id: null,
      attack: null,
      health: null,
      excluded_mana_costs: [],
      excluded_class_ids: [],
      excluded_minion_type_ids: [],
      excluded_rarity_ids: [],
      excluded_card_set_ids: [],
      excluded_attacks: [],
      excluded_healths: [],
    };

    for (const hint of hints) {
      if (hint.type === 'mana_cost') {
        newFilter.mana_cost = Number(hint.value);
      } else if (hint.type === 'attack') {
        newFilter.attack = Number(hint.value);
      } else if (hint.type === 'health') {
        newFilter.health = Number(hint.value);
      } else if (hint.type === 'class_id') {
        const classId = Object.entries(Classes).find(([, name]) => name === hint.value)?.[0] || null;
        newFilter.class_id = classId;
      } else if (hint.type === 'minion_type_id') {
        if (hint.value === '无') {
          newFilter.minion_type_id = '';
        } else {
          const typeId = Object.entries(MinionTypes).find(([, name]) => name === hint.value)?.[0] || null;
          newFilter.minion_type_id = typeId;
        }
      } else if (hint.type === 'rarity_id') {
        const rarityId = Object.entries(Rarities).find(([, name]) => name === hint.value)?.[0] || null;
        newFilter.rarity_id = rarityId;
      } else if (hint.type === 'card_set_id') {
        const setId = Object.entries(Series).find(([, name]) => name === hint.value)?.[0] || null;
        newFilter.card_set_id = setId ? Number(setId) : null;
      }
    }

    const matchedCosts = new Set<number>();
    const matchedClasses = new Set<string>();
    const matchedMinionTypes = new Set<string>();
    const matchedRarities = new Set<string>();
    const matchedAttacks = new Set<number>();
    const matchedHealths = new Set<number>();
    const matchedCardSets = new Set<number>();

    const excludedCosts = new Set<number>();
    const excludedClasses = new Set<string>();
    const excludedMinionTypes = new Set<string>();
    const excludedRarities = new Set<string>();
    const excludedAttacks = new Set<number>();
    const excludedHealths = new Set<number>();
    const excludedCardSets = new Set<number>();

    for (const guess of guesses) {
      if (guess.details.mana_cost) {
        matchedCosts.add(guess.card.mana_cost);
      } else {
        excludedCosts.add(guess.card.mana_cost);
      }
      if (guess.details.attack) {
        matchedAttacks.add(guess.card.attack || 0);
      } else {
        excludedAttacks.add(guess.card.attack || 0);
      }
      if (guess.details.health) {
        matchedHealths.add(guess.card.health);
      } else {
        excludedHealths.add(guess.card.health);
      }
      if (guess.details.class_id) {
        matchedClasses.add(guess.card.class_id);
      } else {
        excludedClasses.add(guess.card.class_id);
      }
      if (guess.details.minion_type_id) {
        matchedMinionTypes.add(guess.card.minion_type_id || '');
      } else {
        excludedMinionTypes.add(guess.card.minion_type_id || '');
      }
      if (guess.details.rarity_id) {
        matchedRarities.add(guess.card.rarity_id);
      } else {
        excludedRarities.add(guess.card.rarity_id);
      }
      if (guess.details.card_set_id) {
        matchedCardSets.add(guess.card.card_set_id);
      } else {
        excludedCardSets.add(guess.card.card_set_id);
      }
    }

    if (matchedCosts.size === 1 && newFilter.mana_cost === null) {
      newFilter.mana_cost = Array.from(matchedCosts)[0];
    }
    if (matchedAttacks.size === 1 && newFilter.attack === null) {
      newFilter.attack = Array.from(matchedAttacks)[0];
    }
    if (matchedHealths.size === 1 && newFilter.health === null) {
      newFilter.health = Array.from(matchedHealths)[0];
    }
    if (matchedClasses.size === 1 && newFilter.class_id === null) {
      newFilter.class_id = Array.from(matchedClasses)[0];
    }
    if (matchedMinionTypes.size === 1 && newFilter.minion_type_id === null) {
      newFilter.minion_type_id = Array.from(matchedMinionTypes)[0];
    }
    if (matchedRarities.size === 1 && newFilter.rarity_id === null) {
      newFilter.rarity_id = Array.from(matchedRarities)[0];
    }
    if (matchedCardSets.size === 1 && newFilter.card_set_id === null) {
      newFilter.card_set_id = Array.from(matchedCardSets)[0];
    }

    newFilter.excluded_mana_costs = Array.from(excludedCosts);
    newFilter.excluded_attacks = Array.from(excludedAttacks);
    newFilter.excluded_healths = Array.from(excludedHealths);
    newFilter.excluded_class_ids = Array.from(excludedClasses);
    newFilter.excluded_minion_type_ids = Array.from(excludedMinionTypes);
    newFilter.excluded_rarity_ids = Array.from(excludedRarities);
    newFilter.excluded_card_set_ids = Array.from(excludedCardSets);

    setFilter(newFilter);
  }, [hints, guesses, setFilter]);

  const resetFilter = () => {
    setFilter({
      mana_cost: null,
      class_id: null,
      minion_type_id: null,
      rarity_id: null,
      card_set_id: null,
      attack: null,
      health: null,
      excluded_mana_costs: [],
      excluded_class_ids: [],
      excluded_minion_type_ids: [],
      excluded_rarity_ids: [],
      excluded_card_set_ids: [],
      excluded_attacks: [],
      excluded_healths: [],
    });
    setSearch('');
  };

  const handleManaToggle = (cost: number) => {
    setFilter((prev) =>
      prev.mana_cost === cost
        ? { ...prev, mana_cost: null }
        : { ...prev, mana_cost: cost }
    );
  };

  const handleClassToggle = (id: string) => {
    setFilter((prev) =>
      prev.class_id === id
        ? { ...prev, class_id: null }
        : { ...prev, class_id: id }
    );
  };

  const manaChips: Array<{ value: number; label: string }> = [];
  for (let i = 0; i <= 10; i++) {
    manaChips.push({ value: i, label: i === 10 ? '10+' : String(i) });
  }
  void uniqueCosts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, minHeight: 0 }}>
      {/* 顶部筛选条（炉石卡牌浏览器风格） */}
      <div
        style={{
          background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
          border: '2px solid #5a3a1a',
          borderRadius: 8,
          padding: isMobile ? '8px 10px' : '10px 12px',
          color: '#f4e4bc',
          boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 6 : 10,
        }}
      >
        {isMobile ? (
          /* ===== 移动端：简化版筛选条（只显示一键过滤） ===== */
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {canAutoFilter ? (
              <button
                onClick={handleAutoFilter}
                style={{
                  ...autoFilterBtn,
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                }}
                title="根据提示和猜测自动缩小候选池"
              >
                一键过滤
              </button>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  color: '#a08a6a',
                  padding: '6px 4px',
                }}
              >
                暂无提示/猜测可参考
              </span>
            )}
            <button
              onClick={resetFilter}
              style={{
                ...chipBase,
                padding: '6px 12px',
                flexShrink: 0,
                fontSize: 12,
              }}
            >
              清除过滤
            </button>
            <button
              onClick={() => setMobileFilterOpen(true)}
              style={{
                ...chipBase,
                flexShrink: 0,
                padding: '6px 10px',
                fontSize: 12,
              }}
              title="展开高级筛选"
            >
              🎯 筛选
            </button>
            <span
              style={{
                fontSize: 12,
                color: '#d4b886',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              匹配 <strong style={{ color: '#ffd966' }}>{filteredCards.length}</strong> /{' '}
              {cards.length} 张
            </span>
          </div>
        ) : (
          /* ===== 桌面端：完整版筛选条 ===== */
          <>
            {/* 第 1 行：职业 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={filterBarLabel}>职业</span>
              <button
                onClick={() => handleClassToggle('')}
                style={filter.class_id === null ? chipActive : chipBase}
                title="全部职业"
              >
                全部
              </button>
              {classIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleClassToggle(id)}
                  style={filter.class_id === id ? chipActive : chipBase}
                >
                  {Classes[id]}
                </button>
              ))}
            </div>

            {/* 第 2 行：水晶 + 搜索 + 筛选按钮 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={filterBarLabel}>水晶</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {manaChips.map((c) => (
                  <div
                    key={c.value}
                    onClick={() => handleManaToggle(c.value)}
                    style={filter.mana_cost === c.value ? manaChipActive : manaChipBase}
                    title={`${c.label} 费`}
                  >
                    {c.label}
                  </div>
                ))}
              </div>

              {/* 搜索框：窄屏时独占一行 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: '1 1 200px',
                  minWidth: 160,
                  background: '#1a1208',
                  border: '1px solid #5a3a1a',
                  borderRadius: 16,
                  padding: '0 4px 0 10px',
                }}
              >
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="输入卡牌名称搜索..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#f4e4bc',
                    fontSize: 13,
                    padding: '6px 4px',
                  }}
                />
                <button
                  style={{
                    background: 'linear-gradient(to bottom, #ffd966, #b87a2a)',
                    color: '#1a1208',
                    border: '1px solid #5a3a1a',
                    borderRadius: 12,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  搜索
                </button>
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                style={{
                  ...chipBase,
                  background: advancedOpen
                    ? 'linear-gradient(to bottom, #6b4a2a, #4a3320)'
                    : chipBase.background,
                  color: advancedOpen ? '#ffd966' : chipBase.color,
                  flexShrink: 0,
                }}
              >
                ⚙ 筛选{advancedOpen ? ' ▲' : ' ▼'}
              </button>
            </div>

            {/* 操作按钮行（一键过滤 / 清除 / 计数） */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                paddingTop: 6,
                borderTop: '1px dashed #5a3a1a',
              }}
            >
              {canAutoFilter && (
                <button
                  onClick={handleAutoFilter}
                  style={autoFilterBtn}
                  title="根据提示和猜测自动缩小候选池"
                >
                  一键过滤
                </button>
              )}
              <button
                onClick={resetFilter}
                style={{
                  ...chipBase,
                  padding: '4px 14px',
                  flexShrink: 0,
                }}
              >
                清除过滤
              </button>
              <span
                style={{
                  fontSize: 12,
                  color: '#d4b886',
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                匹配 <strong style={{ color: '#ffd966' }}>{filteredCards.length}</strong> /{' '}
                {cards.length} 张
              </span>
            </div>

            {/* 高级筛选 */}
            {advancedOpen && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <SelectFilter
                  label="种族"
                  value={filter.minion_type_id}
                  options={uniqueMinionTypes.map((id) => ({
                    value: id,
                    label: MinionTypes[id as keyof typeof MinionTypes] || id,
                  }))}
                  onChange={(v) => setFilter((prev) => ({ ...prev, minion_type_id: v }))}
                />
                <SelectFilter
                  label="稀有度"
                  value={filter.rarity_id}
                  options={uniqueRarities.map((id) => ({
                    value: id,
                    label: Rarities[id as keyof typeof Rarities] || id,
                  }))}
                  onChange={(v) => setFilter((prev) => ({ ...prev, rarity_id: v }))}
                />
                <SelectFilter
                  label="系列"
                  value={filter.card_set_id}
                  options={uniqueSets.map((id) => ({
                    value: id,
                    label: Series[String(id) as keyof typeof Series] || String(id),
                  }))}
                  onChange={(v) => setFilter((prev) => ({ ...prev, card_set_id: v }))}
                />
                <SelectFilter
                  label="攻击力"
                  value={filter.attack}
                  options={Array.from(new Set(cards.map((c) => c.attack || 0)))
                    .sort((a, b) => a - b)
                    .map((a) => ({ value: a, label: String(a) }))}
                  onChange={(v) => setFilter((prev) => ({ ...prev, attack: v }))}
                />
                <SelectFilter
                  label="生命值"
                  value={filter.health}
                  options={Array.from(new Set(cards.map((c) => c.health)))
                    .sort((a, b) => a - b)
                    .map((h) => ({ value: h, label: String(h) }))}
                  onChange={(v) => setFilter((prev) => ({ ...prev, health: v }))}
                />
              </div>
            )}
          </>
        )}

        {/* 排除条件标签 */}
        {(filter.excluded_mana_costs.length > 0 ||
          filter.excluded_class_ids.length > 0 ||
          filter.excluded_minion_type_ids.length > 0 ||
          filter.excluded_rarity_ids.length > 0 ||
          filter.excluded_attacks.length > 0 ||
          filter.excluded_healths.length > 0 ||
          filter.excluded_card_set_ids.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#d4b886' }}>已排除:</span>
            {filter.excluded_mana_costs.map((v) => (
              <span
                key={`cost-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                费用{v}
              </span>
            ))}
            {filter.excluded_attacks.map((v) => (
              <span
                key={`atk-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                攻{v}
              </span>
            ))}
            {filter.excluded_healths.map((v) => (
              <span
                key={`hp-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                血{v}
              </span>
            ))}
            {filter.excluded_class_ids.map((v) => (
              <span
                key={`cls-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                {Classes[v as keyof typeof Classes] || v}
              </span>
            ))}
            {filter.excluded_minion_type_ids.map((v) => (
              <span
                key={`type-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                {MinionTypes[v as keyof typeof MinionTypes] || v || '无种族'}
              </span>
            ))}
            {filter.excluded_rarity_ids.map((v) => (
              <span
                key={`rarity-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                {Rarities[v as keyof typeof Rarities] || v}
              </span>
            ))}
            {filter.excluded_card_set_ids.map((v) => (
              <span
                key={`set-${v}`}
                style={{
                  fontSize: 11,
                  background: '#7a1a1a',
                  color: '#ffe0e0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: '1px solid #c4302b',
                }}
              >
                {Series[String(v) as keyof typeof Series] || `系列${v}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 卡牌网格 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: isMobile ? 8 : 12,
          background: 'rgba(42, 31, 23, 0.35)',
          border: '2px solid #5a3a1a',
          borderRadius: 8,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(140px, 1fr))'
              : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: isMobile ? 8 : 12,
            alignContent: 'start',
          }}
        >
          {filteredCards.map((card) => (
            <div
              key={card.id}
              style={{ display: 'flex', justifyContent: 'center' }}
            >
              <CardItem card={card} onClick={() => onCardSelect(card)} />
            </div>
          ))}
          {filteredCards.length === 0 && (
            <div
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                color: '#3a2410',
                padding: 40,
                fontSize: 14,
              }}
            >
              没有找到匹配的卡牌
            </div>
          )}
        </div>
      </div>

      {/* 移动端筛选弹窗 */}
      {isMobile && mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="筛选条件"
          onClick={() => setMobileFilterOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'hs-fade-in 0.18s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(to bottom, #3a2c1f, #2a1f17)',
              border: '2px solid #5a3a1a',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              color: '#f4e4bc',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
              animation: 'hs-pop-in 0.22s ease-out',
            }}
          >
            {/* 弹窗标题栏 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px 10px 16px',
                borderBottom: '1px solid #5a3a1a',
                flexShrink: 0,
              }}
            >
              <strong style={{ fontSize: 15, color: '#ffd966' }}>🎯 筛选条件</strong>
              <button
                onClick={() => setMobileFilterOpen(false)}
                aria-label="关闭"
                style={{
                  background: 'transparent',
                  border: '1px solid #5a3a1a',
                  color: '#f4e4bc',
                  borderRadius: 12,
                  padding: '4px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                完成
              </button>
            </div>

            {/* 弹窗内容（可滚动） */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* 按名称搜索 */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffd966',
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  按名称搜索
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#1a1208',
                    border: '1px solid #5a3a1a',
                    borderRadius: 14,
                    padding: '0 4px 0 10px',
                  }}
                >
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="输入卡牌名称或描述关键词..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f4e4bc',
                      fontSize: 13,
                      padding: '8px 4px',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      aria-label="清除搜索"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a08a6a',
                        cursor: 'pointer',
                        padding: '0 8px',
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* 职业 */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffd966',
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  职业
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleClassToggle('')}
                    style={filter.class_id === null ? chipActive : chipBase}
                  >
                    全部
                  </button>
                  {classIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => handleClassToggle(id)}
                      style={filter.class_id === id ? chipActive : chipBase}
                    >
                      {Classes[id]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 水晶 */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffd966',
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  水晶
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {manaChips.map((c) => (
                    <div
                      key={c.value}
                      onClick={() => handleManaToggle(c.value)}
                      style={filter.mana_cost === c.value ? manaChipActive : manaChipBase}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 高级筛选 */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffd966',
                    marginBottom: 8,
                    letterSpacing: 1,
                  }}
                >
                  高级筛选
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <SelectFilter
                    label="种族"
                    value={filter.minion_type_id}
                    options={uniqueMinionTypes.map((id) => ({
                      value: id,
                      label: MinionTypes[id as keyof typeof MinionTypes] || id,
                    }))}
                    onChange={(v) => setFilter((prev) => ({ ...prev, minion_type_id: v }))}
                  />
                  <SelectFilter
                    label="稀有度"
                    value={filter.rarity_id}
                    options={uniqueRarities.map((id) => ({
                      value: id,
                      label: Rarities[id as keyof typeof Rarities] || id,
                    }))}
                    onChange={(v) => setFilter((prev) => ({ ...prev, rarity_id: v }))}
                  />
                  <SelectFilter
                    label="系列"
                    value={filter.card_set_id}
                    options={uniqueSets.map((id) => ({
                      value: id,
                      label: Series[String(id) as keyof typeof Series] || String(id),
                    }))}
                    onChange={(v) => setFilter((prev) => ({ ...prev, card_set_id: v }))}
                  />
                  <SelectFilter
                    label="攻击力"
                    value={filter.attack}
                    options={Array.from(new Set(cards.map((c) => c.attack || 0)))
                      .sort((a, b) => a - b)
                      .map((a) => ({ value: a, label: String(a) }))}
                    onChange={(v) => setFilter((prev) => ({ ...prev, attack: v }))}
                  />
                  <SelectFilter
                    label="生命值"
                    value={filter.health}
                    options={Array.from(new Set(cards.map((c) => c.health)))
                      .sort((a, b) => a - b)
                      .map((h) => ({ value: h, label: String(h) }))}
                    onChange={(v) => setFilter((prev) => ({ ...prev, health: v }))}
                  />
                </div>
              </div>
            </div>

            {/* 弹窗底部操作栏 */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: 12,
                borderTop: '1px solid #5a3a1a',
                background: 'rgba(0,0,0,0.25)',
                flexShrink: 0,
              }}
            >
              {canAutoFilter && (
                <button
                  onClick={handleAutoFilter}
                  style={{
                    ...autoFilterBtn,
                    flex: 1,
                    justifyContent: 'center',
                    padding: '8px 14px',
                    fontSize: 14,
                  }}
                >
                  一键过滤
                </button>
              )}
              <button
                onClick={resetFilter}
                style={{
                  ...chipBase,
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  justifyContent: 'center',
                }}
              >
                清除过滤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

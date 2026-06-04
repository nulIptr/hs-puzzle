
// 卡牌类型定义
export interface Card {
  id: number;
  collectible: number;
  slug: string;
  class_id: number;
  multi_class_ids: number[];
  minion_type_id: number;
  card_type_id: number;
  card_set_id: number;
  rarity_id: number;
  artist_name: string;
  health: number;
  attack: number | null;
  mana_cost: number;
  name: string;
  text: string;
  image: string;
  image_gold: string;
  flavor_text: string;
  crop_image: string;
  child_ids: number[] | null;
  bundledCardIds: number[] | null;
  is_zilliax_functional_module: boolean;
  is_zilliax_cosmetic_module: boolean;
  keyword_ids: number[] | null;
  parent_id: number;
  tourist_class_id: number;
  runeCost: { blood: number; frost: number; unholy: number };
  factionId: number | null;
  spellSchoolId: number;
  set_priority: number;
  class_priority: number;
}

export interface Hint {
  type: HintType;
  label: string;
  value: string | number;
}

export type HintType = 'mana_cost' | 'attack' | 'health' | 'class_id' | 'minion_type_id' | 'card_set_id' | 'rarity_id';

export interface GuessResult {
  card: Card;
  matchCount: number;
  details: {
    mana_cost: boolean;
    attack: boolean;
    health: boolean;
    class_id: boolean;
    minion_type_id: boolean;
    card_set_id: boolean;
    rarity_id: boolean;
    keyword_ids: boolean;
  };
}

export interface FilterState {
  mana_cost: number | null;
  class_id: number | null;
  minion_type_id: number | null;
  rarity_id: number | null;
  card_set_id: number | null;
  attack: number | null;
  health: number | null;
}

export interface Metadata {
  classes: Record<number, string>;
  rarities: Record<number, string>;
  minionTypes: Record<number, string>;
  cardSets: Record<number, string>;
}


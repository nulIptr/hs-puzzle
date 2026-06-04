export interface Card {
  id: number;
  collectible: number;
  slug: string;
  class_id: string;
  multi_class_ids: string[];
  minion_type_id: string;
  card_type_id: string;
  card_set_id: number;
  rarity_id: string;
  artist_name: string;
  health: number;
  attack: number;
  mana_cost: number;
  name: string;
  text: string;
  image: string;
  image_gold: string;
  flavor_text: string;
  crop_image: string;
  child_ids?: number[];
  keyword_ids: any;
  runeCost: { blood: number; frost: number; unholy: number };
  standard: number;
  wild: number;
  series_name: string;
  series_abbr: string;
}

export interface Hint {
  type: HintType;
  label: string;
  value: string | number;
}

export type HintType = 'mana_cost' | 'attack' | 'health' | 'class_id' | 'minion_type_id' | 'card_set_id' | 'rarity_id';

export interface GuessResult {
  id: string;
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

export type GameMode = 'standard' | 'wild';

export interface RoundResult {
  card: Card;
  hintCount: number;
  guessCount: number;
}

export interface HistoryEntry {
  id: string;
  finishedAt: number;
  gameMode: GameMode;
  score: number;
  totalHints: number;
  totalGuesses: number;
  rounds: RoundResult[];
}

export interface FilterState {
  mana_cost: number | null;
  class_id: string | null;
  minion_type_id: string | null;
  rarity_id: string | null;
  card_set_id: number | null;
  attack: number | null;
  health: number | null;
  excluded_mana_costs: number[];
  excluded_class_ids: string[];
  excluded_minion_type_ids: string[];
  excluded_rarity_ids: string[];
  excluded_card_set_ids: number[];
  excluded_attacks: number[];
  excluded_healths: number[];
}

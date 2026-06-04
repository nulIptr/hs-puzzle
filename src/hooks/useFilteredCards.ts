
import React, { useCallback, useState } from 'react';
import type { FilterState } from '../types';

const initialFilter: FilterState = {
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

export const useFilteredCards = () => {
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const resetFilter = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  return { filter, setFilter, resetFilter };
};


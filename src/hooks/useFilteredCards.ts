
import React, { useState } from 'react';
import { FilterState } from '../types';

export const useFilteredCards = () => {
  const [filter, setFilter] = useState<FilterState>({
    mana_cost: null,
    class_id: null,
    minion_type_id: null,
    rarity_id: null,
    card_set_id: null,
    attack: null,
    health: null,
  });

  return { filter, setFilter };
};


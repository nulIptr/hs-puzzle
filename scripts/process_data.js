
import fs from 'fs';
import path from 'path';

// 读取原始数据
const dataPath = path.join(import.meta.dirname, '..', 'hs_cards_complete.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

// 筛选随从卡牌 (card_type_id=4)
const minionCards = data.cards.filter(card =&gt; card.card_type_id === 4);
console.log(`筛选出 ${minionCards.length} 张随从卡牌`);

// 手动定义元数据映射
const metadata = {
  classes: {
    0: '全部',
    1: '战士',
    2: '萨满祭司',
    3: '猎人',
    4: '圣骑士',
    5: '死亡骑士',
    6: '牧师',
    7: '潜行者',
    8: '法师',
    9: '术士',
    10: '德鲁伊',
    11: '恶魔猎手',
    12: '中立'
  },
  rarities: {
    0: '不限',
    1: '普通',
    2: '稀有',
    3: '史诗',
    4: '传说',
    5: '传说'
  },
  minionTypes: {
    0: '无',
    1: '野兽',
    2: '恶魔',
    3: '龙',
    4: '机械',
    5: '海盗',
    6: '鱼人',
    7: '图腾',
    8: '亡灵',
    9: '元素',
    10: '纳迦',
    11: '野猪人',
    12: '德莱尼'
  },
  cardSets: {}
};

// 从卡牌中提取系列名称（通过统计）
const setCount = {};
minionCards.forEach(card =&gt; {
  const setId = card.card_set_id;
  if (!setCount[setId]) setCount[setId] = 0;
  setCount[setId]++;
});

console.log('\n卡牌系列ID统计:');
for (const [id, count] of Object.entries(setCount).sort(([a], [b]) =&gt; Number(b) - Number(a))) {
  console.log(`  ID ${id}: ${count} 张`);
  metadata.cardSets[id] = `系列${id}`;
}

// 保存处理后的数据
const outputDir = path.join(import.meta.dirname, '..', 'src', 'data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const outputData = {
  cards: minionCards,
  metadata: metadata
};

fs.writeFileSync(
  path.join(outputDir, 'cardsData.ts'),
  `export const CARDS_DATA = ${JSON.stringify(outputData.cards, null, 2)} as const;\n\nexport const METADATA = ${JSON.stringify(outputData.metadata, null, 2)} as const;\n`
);

console.log(`\n数据已保存到 src/data/cardsData.ts`);


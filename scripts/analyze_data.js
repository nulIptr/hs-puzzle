
import fs from 'fs';
import path from 'path';

const dataPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'hs_cards_complete.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

console.log(`总卡牌数: ${data.cards.length}`);

// 统计 card_type_id
const typeCounts = {};
const typeSamples = {};

for (const card of data.cards) {
  const typeId = card.card_type_id;
  typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
  if (!typeSamples[typeId]) typeSamples[typeId] = [];
  if (typeSamples[typeId].length &lt; 3) {
    typeSamples[typeId].push(card);
  }
}

console.log('\ncard_type_id 分布:');
for (const [id, count] of Object.entries(typeCounts).sort(([a], [b]) =&gt; Number(a) - Number(b))) {
  console.log(`  ID=${id}: ${count} 张`);
  for (const sample of typeSamples[Number(id)]) {
    console.log(`    - ${sample.name} (id:${sample.id})`);
  }
}

console.log('\n\n随机查看几张卡牌的完整结构:');
for (let i = 0; i &lt; 5; i++) {
  const card = data.cards[Math.floor(Math.random() * data.cards.length)];
  console.log(`\n--- ${card.name} ---`);
  console.log(JSON.stringify(card, null, 2));
}


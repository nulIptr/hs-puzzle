// 把 hs_cards_data.json 按游戏模式拆分为两份数据：
//   hs_cards_data.standard.json  仅含标准系列随从
//   hs_cards_data.wild.json      含全部随从
// 在 dev/build 之前由 package.json 的 predev / prebuild 钩子自动触发。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const sourceFile = path.join(root, 'hs_cards_data.json');
const standardOut = path.join(root, 'hs_cards_data.standard.json');
const wildOut = path.join(root, 'hs_cards_data.wild.json');

const isMinion = (card) =>
  card && card.card_type_id === '随从' && card.collectible === 1;

const main = () => {
  if (!fs.existsSync(sourceFile)) {
    console.warn(`[split-cards] 未找到 ${sourceFile}，跳过拆分`);
    return;
  }

  const raw = fs.readFileSync(sourceFile, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data.cards)) {
    console.warn('[split-cards] hs_cards_data.json 结构异常（缺少 cards 数组）');
    return;
  }

  const allMinions = data.cards.filter(isMinion);
  const standardMinions = allMinions.filter((c) => c.standard === 1);

  const writeSplit = (file, cards) => {
    const payload = { ...data, cards };
    fs.writeFileSync(file, JSON.stringify(payload));
  };

  writeSplit(standardOut, standardMinions);
  writeSplit(wildOut, allMinions);

  const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(
    `[split-cards] standard=${standardMinions.length} 张 (${fmt(fs.statSync(standardOut).size)}) ` +
      `| wild=${allMinions.length} 张 (${fmt(fs.statSync(wildOut).size)})`
  );
};

main();

// 静态小数据：保持在主包中
export const Series = {
  "2": "怀旧系列",
  "9": "纳克萨玛斯",
  "10": "地精大战侏儒",
  "11": "黑石山的火焰",
  "12": "冠军的试炼",
  "13": "探险者协会",
  "14": "古神的低语",
  "15": "卡拉赞之夜",
  "16": "龙争虎斗加基森",
  "17": "勇闯安戈洛",
  "18": "冰封王座的骑士",
  "19": "狗头人与地下世界",
  "21": "女巫森林",
  "23": "砰砰计划",
  "24": "拉斯塔哈的大乱斗",
  "25": "暗影崛起",
  "26": "奥丹姆奇兵",
  "27": "巨龙降临",
  "28": "迦拉克隆的觉醒",
  "31": "恶魔猎手新兵",
  "32": "外域的灰烬",
  "35": "通灵学园",
  "36": "疯狂的暗月马戏团",
  "37": "暗月竞速赛",
  "40": "贫瘠之地的锤炼",
  "42": "哀嚎洞穴",
  "43": "暴风城下的集结",
  "44": "死亡矿井",
  "45": "奥特兰克的决裂",
  "46": "奥妮克希亚的巢穴",
  "48": "探寻沉没之城",
  "49": "潮汐王座",
  "50": "纳斯利亚堡的悬案",
  "51": "混乱噬渊",
  "52": "巫妖王的进军",
  "53": "阿尔萨斯之路",
  "54": "重返纳克萨玛斯",
  "55": "传奇音乐节",
  "58": "音乐之劫",
  "59": "泰坦诸神",
  "60": "时光之穴",
  "61": "奥杜尔的陷落",
  "62": "决战荒芜之地",
  "63": "深入深岩之洲",
  "65": "活动",
  "66": "威兹班的工坊",
  "67": "砰砰博士的疯狂发明",
  "68": "胜地历险记",
  "69": "行旅旅行社",
  "70": "深暗领域",
  "71": "奇利亚斯豪华版3000型",
  "72": "星际英雄传",
  "73": "漫游翡翠梦境",
  "75": "世界之树的余烬",
  "76": "安戈洛龟途",
  "77": "重生之日",
  "78": "穿越时间流",
  "79": "永恒回响",
  "80": "大地的裂变",
  "81": "核心2026",
  "82": "治愈艾泽拉斯",
  "83": "逃离紫罗兰监狱"
} as const

export const Classes = {
  "Neutral": "中立",
  "Druid": "德鲁伊",
  "Hunter": "猎人",
  "Mage": "法师",
  "Paladin": "圣骑士",
  "Rogue": "潜行者",
  "Shaman": "萨满祭司",
  "Priest": "牧师",
  "Warlock": "术士",
  "Demonhunter": "恶魔猎手",
  "Warrior": "战士",
  "Deathknight": "死亡骑士"
} as const

export const Rarities = {
  "普通": "普通",
  "稀有": "稀有",
  "史诗": "史诗",
  "传说": "传说",
  "基本": "基本",
  "无": "无"
} as const

export const CardTypes = {
  "随从": "随从",
  "法术": "法术",
  "武器": "武器",
  "地标": "地标",
  "英雄牌": "英雄牌",
  "装备": "装备"
} as const

export const MinionTypes = {
  "亡灵": "亡灵",
  "野兽": "野兽",
  "德莱尼": "德莱尼",
  "龙": "龙",
  "恶魔": "恶魔",
  "海盗": "海盗",
  "鱼人": "鱼人",
  "元素": "元素",
  "图腾": "图腾",
  "机械": "机械",
  "野猪人": "野猪人",
  "纳迦": "纳迦",
  "全部": "全部"
} as const

export const SpellSchools = {
  "奥术": "arcane",
  "火焰": "fire",
  "冰霜": "frost",
  "自然": "nature",
  "神圣": "holy",
  "暗影": "shadow",
  "邪能": "fel"
} as const

export interface Card {
  id: number
  collectible: number
  slug: string
  class_id: string
  multi_class_ids: string[]
  minion_type_id: string
  card_type_id: string
  card_set_id: number
  rarity_id: string
  artist_name: string
  health: number
  attack: number
  mana_cost: number
  name: string
  text: string
  image: string
  image_gold: string
  flavor_text: string
  crop_image: string
  child_ids?: number[]
  keyword_ids: any
  runeCost: RuneCost
  standard: number
  wild: number
  series_name: string
  series_abbr: string
}

export interface RuneCost {
  blood: number
  frost: number
  unholy: number
}

// 卡牌数据按游戏模式拆分为两份 JSON（由 scripts/split-cards.mjs 生成），
// 首次进入页面时主 bundle 不必打包任何卡牌数据；默认的标准模式只下载小文件。
type CardsMode = 'standard' | 'wild';

const _cardsCache: Record<CardsMode, Card[] | null> = {
  standard: null,
  wild: null,
};
const _cardsPromise: Record<CardsMode, Promise<Card[]> | null> = {
  standard: null,
  wild: null,
};

export const loadCards = (mode: CardsMode = 'standard'): Promise<Card[]> => {
  if (_cardsCache[mode]) return Promise.resolve(_cardsCache[mode]!);
  if (!_cardsPromise[mode]) {
    /// @ts-ignore
    _cardsPromise[mode] = import(
      /* webpackChunkName: "hs-cards-data" */ `../../hs_cards_data.${mode}.json`
    ).then((mod) => {
      const cards = ((mod as any).default ?? mod).cards as Card[];
      _cardsCache[mode] = cards;
      return cards;
    });
  }
  return _cardsPromise[mode]!;
};

export const getCardsSync = (mode: CardsMode = 'standard'): Card[] | null =>
  _cardsCache[mode];


export const SeriesInfo: {
  abbr: string;
  classic: number;
  clazz: string;
  created: number;
  ename: string;
  gameAbbr: string;
  id: number;
  img: string;
  name: string;
  pubTime: string;
  scored: number;
  size: number;
  standard: number;
  unpack: number;
  unpackUrl: string;
  updated: number;
  visible: number;
  wild: number;
}[]

  = [{ "abbr": "EVH", "classic": 0, "clazz": "默认", "created": 1780586816, "ename": "Escape from Violet Hold", "gameAbbr": "EVH", "id": 83, "img": "", "name": "逃离紫罗兰监狱", "pubTime": "202606", "scored": 0, "size": 3, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1780587069, "visible": 1, "wild": 1 }, { "abbr": "ROA", "classic": 0, "clazz": "默认", "created": 1778040388, "ename": "Restoration of Azeroth", "gameAbbr": "ROA", "id": 82, "img": "", "name": "治愈艾泽拉斯", "pubTime": "", "scored": 0, "size": 34, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1778043632, "visible": 1, "wild": 1 }, { "abbr": "CS2026", "classic": 0, "clazz": "默认", "created": 1772852205, "ename": "Core Set 2026", "gameAbbr": "CS2026", "id": 81, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/CS2026/series/CS2026.png?v=1772901348", "name": "核心2026", "pubTime": "202603", "scored": 0, "size": 293, "standard": 1, "unpack": 0, "unpackUrl": "", "updated": 1775043838, "visible": 1, "wild": 1 }, { "abbr": "CAT", "classic": 0, "clazz": "默认", "created": 1770700203, "ename": "Cataclysm", "gameAbbr": "CAT", "id": 80, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/CAT/series/CAT.png?v=1772901221", "name": "大地的裂变", "pubTime": "202602", "scored": 0, "size": 210, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1775043851, "visible": 1, "wild": 1 }, { "abbr": "EOI", "classic": 0, "clazz": "默认", "created": 1768062034, "ename": "Echoes of the Infinite", "gameAbbr": "EOI", "id": 79, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/EOI/series/EOI.png?v=1772901304", "name": "永恒回响", "pubTime": "202601", "scored": 0, "size": 38, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1775043863, "visible": 1, "wild": 1 }, { "abbr": "ATT", "classic": 1, "clazz": "默认", "created": 1760584517, "ename": "Across the Timeways", "gameAbbr": "ATT", "id": 78, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/ATT/series/ATT.png?v=1761023032", "name": "穿越时间流", "pubTime": "202511", "scored": 0, "size": 194, "standard": 1, "unpack": 0, "unpackUrl": "", "updated": 1764301203, "visible": 1, "wild": 1 }, { "abbr": "DOR", "classic": 0, "clazz": "默认", "created": 1756458477, "ename": "the Day of Rebirth", "gameAbbr": "DOR", "id": 77, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/DOR/series/DOR.png?v=1756870490", "name": "重生之日", "pubTime": "202509", "scored": 0, "size": 45, "standard": 1, "unpack": 0, "unpackUrl": "", "updated": 1764301186, "visible": 1, "wild": 1 }, { "abbr": "LCU", "classic": 0, "clazz": "默认", "created": 1748915508, "ename": "The Lost City of Un’Goro", "gameAbbr": "LCU", "id": 76, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/LCU/series/LCU.png?v=1751357396", "name": "安戈洛龟途", "pubTime": "202506", "scored": 0, "size": 245, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1756801024, "visible": 1, "wild": 1 }, { "abbr": "EWT", "classic": 0, "clazz": "默认", "created": 1745893339, "ename": "Embers of the World Tree", "gameAbbr": "EWT", "id": 75, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/EWT/series/EWT.png?v=1747985354", "name": "世界之树的余烬", "pubTime": "202504", "scored": 0, "size": 40, "standard": 1, "unpack": 0, "unpackUrl": "", "updated": 1760426779, "visible": 1, "wild": 1 }, { "abbr": "IED", "classic": 0, "clazz": "默认", "created": 1739903723, "ename": "Into the Emeral Dream", "gameAbbr": "IED", "id": 73, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/IED/series/IED.png?v=1741597858", "name": "漫游翡翠梦境", "pubTime": "202502", "scored": 0, "size": 222, "standard": 1, "unpack": 1, "unpackUrl": "", "updated": 1753523116, "visible": 1, "wild": 1 }, { "abbr": "HSC", "classic": 0, "clazz": "默认", "created": 1736826175, "ename": "Heroes of StarCraft", "gameAbbr": "HSC", "id": 72, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/HSC/series/HSC.png?v=1738583094", "name": "星际英雄传", "pubTime": "202501", "scored": 0, "size": 49, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1773818798, "visible": 1, "wild": 1 }, { "abbr": "ZD3000", "classic": 0, "clazz": "默认", "created": 1731312476, "ename": "Zilliax Deluxe 3000", "gameAbbr": "ZD3000", "id": 71, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/ZD3000/series/ZD3000.png?v=1731313062", "name": "奇利亚斯豪华版3000型", "pubTime": "202411", "scored": 0, "size": 28, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1773806860, "visible": 1, "wild": 1 }, { "abbr": "GDB", "classic": 0, "clazz": "默认", "created": 1728613883, "ename": "The Great Dark Beyond", "gameAbbr": "GDB", "id": 70, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/GDB/series/GDB.png?v=1728663143", "name": "深暗领域", "pubTime": "202411", "scored": 0, "size": 145, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1773818924, "visible": 1, "wild": 1 }, { "abbr": "TTA", "classic": 0, "clazz": "默认", "created": 1725517445, "ename": "Traveling travel agency", "gameAbbr": "TTA", "id": 69, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/TTA/series/TTA.png?v=1726110174", "name": "行旅旅行社", "pubTime": "202409", "scored": 0, "size": 55, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1773819035, "visible": 1, "wild": 1 }, { "abbr": "PIP", "classic": 0, "clazz": "默认", "created": 1718808401, "ename": "Perils in Paradise", "gameAbbr": "PIP", "id": 68, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/PIP/series/PIP.png", "name": "胜地历险记", "pubTime": "202406", "scored": 0, "size": 327, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1773819069, "visible": 1, "wild": 1 }, { "abbr": "DII", "classic": 0, "clazz": "默认", "created": 1715338390, "ename": "Dr. Boom’s Incredible Inventions", "gameAbbr": "DII", "id": 67, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/DII/series/DII.png?v=1715654207", "name": "砰砰博士的疯狂发明", "pubTime": "202405", "scored": 0, "size": 54, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1773819114, "visible": 1, "wild": 1 }, { "abbr": "WBW", "classic": 0, "clazz": "默认", "created": 1707900417, "ename": "Whizbang's Workshop", "gameAbbr": "WBW", "id": 66, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/WBW/series/WBW.png?v=1708150736", "name": "威兹班的工坊", "pubTime": "202402", "scored": 0, "size": 267, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1773819163, "visible": 1, "wild": 1 }, { "abbr": "GIFT", "classic": 0, "clazz": "默认", "created": 1707900021, "ename": "Event", "gameAbbr": "GIFT", "id": 65, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/GIFT/series/GIFT.png?v=1708150579", "name": "活动", "pubTime": "202040", "scored": 0, "size": 46, "standard": 1, "unpack": 0, "unpackUrl": "", "updated": 1753521214, "visible": 1, "wild": 1 }, { "abbr": "DID", "classic": 0, "clazz": "默认", "created": 1705307666, "ename": "Delve into Deepholm", "gameAbbr": "DID", "id": 63, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/DID/series/DID.png?v=1705482125", "name": "深入深岩之洲", "pubTime": "202401", "scored": 0, "size": 38, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752986070, "visible": 1, "wild": 1 }, { "abbr": "SIB", "classic": 0, "clazz": "默认", "created": 1697696077, "ename": "Showdown in the Badlands", "gameAbbr": "SIB", "id": 62, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/SIB/series/SIB.png?v=1699196492", "name": "决战荒芜之地", "pubTime": "202311", "scored": 0, "size": 145, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752985519, "visible": 1, "wild": 1 }, { "abbr": "FOU", "classic": 0, "clazz": "默认", "created": 1694572222, "ename": "Fall of Ulduar", "gameAbbr": "FOU", "id": 61, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/FOU/series/FOU.png?v=1695031881", "name": "奥杜尔的陷落", "pubTime": "202309", "scored": 0, "size": 38, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752984804, "visible": 1, "wild": 1 }, { "abbr": "COT", "classic": 0, "clazz": "默认", "created": 1692353744, "ename": "Caverns of Time", "gameAbbr": "COT", "id": 60, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/COT/series/COT.png?v=1692871313", "name": "时光之穴", "pubTime": "202308", "scored": 0, "size": 173, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752987790, "visible": 1, "wild": 1 }, { "abbr": "TTN", "classic": 0, "clazz": "默认", "created": 1688008114, "ename": "TITANS", "gameAbbr": "TTN", "id": 59, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/TTN/series/TTN.png?v=1688530789", "name": "泰坦诸神", "pubTime": "202306", "scored": 0, "size": 219, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752984308, "visible": 1, "wild": 1 }, { "abbr": "ADP", "classic": 0, "clazz": "默认", "created": 1685262029, "ename": "Audiopocalypse", "gameAbbr": "ADP", "id": 58, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/ADP/series/ADP.png?v=1688550096", "name": "音乐之劫", "pubTime": "202306", "scored": 0, "size": 64, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752981719, "visible": 1, "wild": 1 }, { "abbr": "FOL", "classic": 0, "clazz": "默认", "created": 1678853723, "ename": "Festival of Legends", "gameAbbr": "BATTLE_OF_THE_BANDS", "id": 55, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/FOL/series/FOL.png?v=1688550120", "name": "传奇音乐节", "pubTime": "202303", "scored": 0, "size": 190, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752987699, "visible": 1, "wild": 1 }, { "abbr": "RTN", "classic": 0, "clazz": "默认", "created": 1676114228, "ename": "RTN", "gameAbbr": "RTN", "id": 54, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/RTN/series/RTN.png?v=1690346141", "name": "重返纳克萨玛斯", "pubTime": "202302", "scored": 0, "size": 0, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752980246, "visible": 1, "wild": 1 }, { "abbr": "POA", "classic": 0, "clazz": "默认", "created": 1667459703, "ename": "POA", "gameAbbr": "POA", "id": 53, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/POA/series/POA.png?v=1690346153", "name": "阿尔萨斯之路", "pubTime": "202211", "scored": 0, "size": 26, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752982008, "visible": 1, "wild": 1 }, { "abbr": "MLK", "classic": 0, "clazz": "默认", "created": 1667325337, "ename": "March of the Lich King", "gameAbbr": "MLK", "id": 52, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/MLK/series/MLK.png?v=1667326180", "name": "巫妖王的进军", "pubTime": "202211", "scored": 0, "size": 145, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752976706, "visible": 1, "wild": 1 }, { "abbr": "MAD", "classic": 0, "clazz": "默认", "created": 1663908405, "ename": "The Maw and Disorder", "gameAbbr": "MAD", "id": 51, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/MAD/series/MAD.png?v=1665214766", "name": "混乱噬渊", "pubTime": "202209", "scored": 0, "size": 35, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753141220, "visible": 1, "wild": 1 }, { "abbr": "MCN", "classic": 0, "clazz": "默认", "created": 1656353122, "ename": "Murder at Castle Nathria", "gameAbbr": "MCN", "id": 50, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/MCN/series/MCN.png?v=1658388586", "name": "纳斯利亚堡的悬案", "pubTime": "202206", "scored": 0, "size": 187, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753141523, "visible": 1, "wild": 1 }, { "abbr": "TOT", "classic": 0, "clazz": "默认", "created": 1653729756, "ename": "Throne of Tides", "gameAbbr": "TOT", "id": 49, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/TOT/series/TOT.png?v=1753142467", "name": "潮汐王座", "pubTime": "202206", "scored": 0, "size": 98, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753142467, "visible": 1, "wild": 1 }, { "abbr": "VSC", "classic": 0, "clazz": "默认", "created": 1647851027, "ename": "Voyage to the Sunken City", "gameAbbr": "VSC", "id": 48, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/VSC/series/VSC.png", "name": "探寻沉没之城", "pubTime": "202203", "scored": 0, "size": 195, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753143900, "visible": 1, "wild": 1 }, { "abbr": "ONL", "classic": 0, "clazz": "默认", "created": 1644747214, "ename": "Onyxia's Lair", "gameAbbr": "ONL", "id": 46, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/ONL/series/ONL.png?v=1644820065", "name": "奥妮克希亚的巢穴", "pubTime": "202202", "scored": 0, "size": 75, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753161486, "visible": 1, "wild": 1 }, { "abbr": "FAV", "classic": 0, "clazz": "默认", "created": 1637774361, "ename": "Fractured in Alterac Valley", "gameAbbr": "FAV", "id": 45, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/FAV/series/FAV.png?v=1637859126", "name": "奥特兰克的决裂", "pubTime": "202112", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753160851, "visible": 1, "wild": 1 }, { "abbr": "DDM", "classic": 0, "clazz": "默认", "created": 1635754132, "ename": "Deadmine", "gameAbbr": "ddm", "id": 44, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/DDM/series/DDM.png?v=1635836968", "name": "死亡矿井", "pubTime": "202110", "scored": 0, "size": 35, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753160478, "visible": 1, "wild": 1 }, { "abbr": "UIS", "classic": 0, "clazz": "默认", "created": 1625225837, "ename": "United in Stormwind", "gameAbbr": "UIS", "id": 43, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/UIS/series/UIS.png", "name": "暴风城下的集结", "pubTime": "202107", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753160240, "visible": 1, "wild": 1 }, { "abbr": "WLC", "classic": 0, "clazz": "默认", "created": 1622694429, "ename": "WAILING CAVERNS", "gameAbbr": "WLC", "id": 42, "img": "https://pic.iyingdi.com/before825java/card/hearthstone/series/WLC/series/WLC.png?v=1622787775", "name": "哀嚎洞穴", "pubTime": "202106", "scored": 0, "size": 35, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753159977, "visible": 1, "wild": 1 }, { "abbr": "FIB", "classic": 0, "clazz": "默认", "created": 1613910900, "ename": "Forged In The Barrens", "gameAbbr": "THE_BARRENS", "id": 40, "img": "https://wspic.iyingdi.cn/card/hearthstone/series/FIB/series/FIBv1616439079.png", "name": "贫瘠之地的锤炼", "pubTime": "202103", "scored": 0, "size": 218, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1756594426, "visible": 1, "wild": 1 }, { "abbr": "DMR", "classic": 0, "clazz": "默认", "created": 1611213771, "ename": "The Darkmoon Races", "gameAbbr": "DMR", "id": 37, "img": "https://wspic.iyingdi.cn/card/hearthstone/series/DMR/series/DMR.png", "name": "暗月竞速赛", "pubTime": "202101", "scored": 0, "size": 40, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753158941, "visible": 1, "wild": 1 }, { "abbr": "DMF", "classic": 0, "clazz": "默认", "created": 1603443885, "ename": "Madness at the Darkmoon Faire", "gameAbbr": "DMF", "id": 36, "img": "https://wspic.iyingdi.cn/card/hearthstone/series/DMF/series/DMFv1603444454.png", "name": "疯狂的暗月马戏团", "pubTime": "202010", "scored": 0, "size": 140, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753158460, "visible": 1, "wild": 1 }, { "abbr": "SCH", "classic": 0, "clazz": "默认", "created": 1594757494, "ename": "Scholomance Academy", "gameAbbr": "SCHOLOMANCE", "id": 35, "img": "https://static.iyingdi.cn/card/hearthstone/series/1/series/1v1594894753.png", "name": "通灵学园", "pubTime": "202007", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753146818, "visible": 1, "wild": 1 }, { "abbr": "AOO", "classic": 0, "clazz": "默认", "created": 1584527922, "ename": "Ashes of Outland", "gameAbbr": "BLACK_TEMPLE", "id": 32, "img": "https://static.iyingdi.cn/card/hearthstone/series/AOO/series/AOOv1585170135.png", "name": "外域的灰烬", "pubTime": "202003", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753158063, "visible": 1, "wild": 1 }, { "abbr": "DHI", "classic": 0, "clazz": "默认", "created": 1584609384, "ename": "Demon Hunter Initial Set", "gameAbbr": "DEMON_HUNTER_INITIAT", "id": 31, "img": "https://wspic.iyingdi.cn/card/hearthstone/series/DHI/series/DHIv1585288634.png", "name": "恶魔猎手新兵", "pubTime": "202003", "scored": 0, "size": 20, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753144231, "visible": 1, "wild": 1 }, { "abbr": "GKA", "classic": 0, "clazz": "默认", "created": 1579155268, "ename": "Galakrond's Awakening", "gameAbbr": "YEAR_OF_THE_DRAGON", "id": 28, "img": "https://wspic.iyingdi.cn/card/hearthstone/series/DOD/series/DODv1579155317.png", "name": "迦拉克隆的觉醒", "pubTime": "202001", "scored": 0, "size": 35, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753093860, "visible": 1, "wild": 1 }, { "abbr": "DOD", "classic": 0, "clazz": "默认", "created": 1573465446, "ename": "Descent of Dragons", "gameAbbr": "DRAGONS", "id": 27, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/DOD/series/DOD.png", "name": "巨龙降临", "pubTime": "201911", "scored": 0, "size": 140, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753093697, "visible": 1, "wild": 1 }, { "abbr": "SOU", "classic": 0, "clazz": "默认", "created": 1562912410, "ename": "Saviors of Uldum", "gameAbbr": "ULDUM", "id": 26, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/SOU/series/SOUv1562913431.png", "name": "奥丹姆奇兵", "pubTime": "201907", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753093415, "visible": 1, "wild": 1 }, { "abbr": "ROS", "classic": 0, "clazz": "默认", "created": 1552749503, "ename": "Rise of Shadows", "gameAbbr": "DALARAN", "id": 25, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/ROS/series/ROSv1553069361.png", "name": "暗影崛起", "pubTime": "201903", "scored": 0, "size": 136, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753092788, "visible": 1, "wild": 1 }, { "abbr": "RST", "classic": 0, "clazz": "默认", "created": 1541199876, "ename": "Rastakhan's Rumble", "gameAbbr": "TROLL", "id": 24, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/RST/series/RSTv1541401594.png", "name": "拉斯塔哈的大乱斗", "pubTime": "201811", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753092324, "visible": 1, "wild": 1 }, { "abbr": "TBP", "classic": 0, "clazz": "默认", "created": 1531804728, "ename": "The Boomsday Project", "gameAbbr": "BOOMSDAY", "id": 23, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/TBP/series/TBP.png", "name": "砰砰计划", "pubTime": "201807", "scored": 0, "size": 136, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753092035, "visible": 1, "wild": 1 }, { "abbr": "TWW", "classic": 0, "clazz": "默认", "created": 1521178395, "ename": "The Witch Wood", "gameAbbr": "GILNEAS", "id": 21, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/TWW/series/TWW.png", "name": "女巫森林", "pubTime": "201831", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753088350, "visible": 1, "wild": 1 }, { "abbr": "KnC", "classic": 0, "clazz": "默认", "created": 1509952915, "ename": "Kobolds and Catacombs", "gameAbbr": "LOOTAPALOOZA", "id": 19, "img": "http://wspic.iyingdi.cn/card/hearthstone/series/KnC/series/KnCv1509955228.png", "name": "狗头人与地下世界", "pubTime": "201711", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753072980, "visible": 1, "wild": 1 }, { "abbr": "kft", "classic": 0, "clazz": "默认", "created": 1499766283, "ename": "Knights of the frozen throne", "gameAbbr": "ICECROWN", "id": 18, "img": "http://static.iyingdi.cn/card/hearthstone/series/kft/series/kft.png", "name": "冰封王座的骑士", "pubTime": "201708", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753072715, "visible": 1, "wild": 1 }, { "abbr": "jug", "classic": 0, "clazz": "默认", "created": 1490237369, "ename": "Journey to Un'Goro", "gameAbbr": "UNGORO", "id": 17, "img": "http://static.iyingdi.cn/card/hearthstone/series/jug/series/jug.png", "name": "勇闯安戈洛", "pubTime": "201703", "scored": 0, "size": 135, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753072117, "visible": 1, "wild": 1 }, { "abbr": "msg", "classic": 0, "clazz": "默认", "created": 1478507390, "ename": "Mean streets of Gadgetzan", "gameAbbr": "GANGS", "id": 16, "img": "http://static.iyingdi.cn/card/hearthstone/series/msg/series/msg.png", "name": "龙争虎斗加基森", "pubTime": "201612", "scored": 1, "size": 131, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753072250, "visible": 1, "wild": 1 }, { "abbr": "onk", "classic": 0, "clazz": "默认", "created": 1470541731, "ename": "One night in Karazhan", "gameAbbr": "KARA", "id": 15, "img": "http://static.iyingdi.cn/card/hearthstone/series/onk/series/onk.png", "name": "卡拉赞之夜", "pubTime": "201608", "scored": 1, "size": 47, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753069208, "visible": 1, "wild": 1 }, { "abbr": "wog", "classic": 0, "clazz": "默认", "created": 1461321573, "ename": "Whispers of the Old gods", "gameAbbr": "OG", "id": 14, "img": "http://static.iyingdi.cn/card/hearthstone/series/wog/series/wog.png", "name": "古神的低语", "pubTime": "201604", "scored": 0, "size": 162, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753069865, "visible": 1, "wild": 1 }, { "abbr": "loe", "classic": 0, "clazz": "默认", "created": 1454317571, "ename": "The league of Explorers", "gameAbbr": "LOE", "id": 13, "img": "http://static.iyingdi.cn/card/hearthstone/series/loe/series/loe.png", "name": "探险者协会", "pubTime": "201511", "scored": 1, "size": 48, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1753273136, "visible": 1, "wild": 1 }, { "abbr": "tgt", "classic": 0, "clazz": "默认", "created": 1444375898, "ename": "The Grand Tournament", "gameAbbr": "TGT", "id": 12, "img": "http://static.iyingdi.cn/card/hearthstone/series/tgt/series/tgt.png", "name": "冠军的试炼", "pubTime": "201508", "scored": 1, "size": 132, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1753065784, "visible": 1, "wild": 1 }, { "abbr": "brm", "classic": 0, "clazz": "默认", "created": 1454382889, "ename": "Blackrock Mountain", "gameAbbr": "BRM", "id": 11, "img": "http://static.iyingdi.cn/card/hearthstone/series/brm/series/brm.png", "name": "黑石山的火焰", "pubTime": "201503", "scored": 1, "size": 34, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752974958, "visible": 1, "wild": 1 }, { "abbr": "gvg", "classic": 0, "clazz": "默认", "created": 1444375898, "ename": "Goblins VS Gnomes", "gameAbbr": "GVG", "id": 10, "img": "http://static.iyingdi.cn/card/hearthstone/series/gvg/series/gvg.png", "name": "地精大战侏儒", "pubTime": "201412", "scored": 1, "size": 130, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1752974684, "visible": 1, "wild": 1 }, { "abbr": "naxx", "classic": 0, "clazz": "默认", "created": 1453108641, "ename": "Naxxramas", "gameAbbr": "NAXX", "id": 9, "img": "http://static.iyingdi.cn/card/hearthstone/series/naxx/series/naxx.png", "name": "纳克萨玛斯", "pubTime": "201406", "scored": 1, "size": 31, "standard": 0, "unpack": 0, "unpackUrl": "", "updated": 1752974377, "visible": 1, "wild": 1 }, { "abbr": "basic", "classic": 0, "clazz": "默认", "created": 1453108008, "ename": "Basic", "gameAbbr": "LEGACY", "id": 2, "img": "http://static.iyingdi.cn/card/hearthstone/series/basic/series/basic.png", "name": "怀旧系列", "pubTime": "201409", "scored": 1, "size": 623, "standard": 0, "unpack": 1, "unpackUrl": "", "updated": 1756594507, "visible": 1, "wild": 1 }]
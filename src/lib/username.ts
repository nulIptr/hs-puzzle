// 排行榜用户名 localStorage 工具
// - 写入 / 读取 / 清除
// - 校验规则与服务端一致: 1~20 字符, trim, 去除控制字符
// - 即便读不到 localStorage (隐私模式) 也不抛错, 仅降级为空字符串

const USERNAME_KEY = 'hs-puzzle.leaderboard.username';
const MAX_LEN = 20;
const MIN_LEN = 1;

const stripControl = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, '');

export const sanitizeUsername = (raw: string): string => stripControl(raw).trim().slice(0, MAX_LEN);

export const isValidUsername = (s: string): boolean => {
  const t = sanitizeUsername(s);
  return t.length >= MIN_LEN && t.length <= MAX_LEN;
};

export const getStoredUsername = (): string => {
  try {
    const v = window.localStorage.getItem(USERNAME_KEY);
    return v ? sanitizeUsername(v) : '';
  } catch {
    return '';
  }
};

export const setStoredUsername = (raw: string): string => {
  const cleaned = sanitizeUsername(raw);
  try {
    if (cleaned) {
      window.localStorage.setItem(USERNAME_KEY, cleaned);
    } else {
      window.localStorage.removeItem(USERNAME_KEY);
    }
  } catch {
    // ignore
  }
  return cleaned;
};

export const clearStoredUsername = (): void => {
  try {
    window.localStorage.removeItem(USERNAME_KEY);
  } catch {
    // ignore
  }
};

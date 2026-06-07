import { useEffect, useState } from 'react';

/**
 * 监听窗口宽度是否 ≤ breakpoint，返回布尔值。
 * 服务端渲染安全：首帧给出 false，hydration 后再同步真实值。
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = (matches: boolean) => setIsMobile(matches);
    update(mq.matches);
    // Safari < 14 仅有 addListener
    if (mq.addEventListener) {
      mq.addEventListener('change', (e) => update(e.matches));
      return () => mq.removeEventListener('change', (e) => update(e.matches));
    } else {
      const handler = (e: MediaQueryListEvent) => update(e.matches);
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, [breakpoint]);

  return isMobile;
}

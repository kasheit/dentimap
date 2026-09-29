import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number from its previous value to `target` — the "hero figure feels
 * alive" touch common to Stripe/Linear/Mercury-style dashboards. Deliberately restrained for
 * an operator tool checked many times a day: it jumps straight to the value on first mount
 * (nothing to animate from, and animating every time a location is opened would get old fast)
 * and only eases when the underlying number actually changes while mounted — e.g. right after
 * confirming a source or editing the assessed value. Skips the animation entirely under
 * prefers-reduced-motion.
 */
export function useCountUp(target: number | undefined, duration = 700): number | undefined {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const frame = useRef<number>();

  useEffect(() => {
    if (target === undefined) {
      setValue(undefined);
      prevTarget.current = undefined;
      return;
    }
    const from = prevTarget.current ?? target;
    prevTarget.current = target;
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (from === target || reduceMotion) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(from + (target - from) * ease(t)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

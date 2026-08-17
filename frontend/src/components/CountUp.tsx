import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
}

export function CountUp({ end, duration = 600, className }: CountUpProps) {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const from = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (end - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [end, duration]);

  return <span className={className}>{value}</span>;
}

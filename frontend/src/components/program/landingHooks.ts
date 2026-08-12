import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = document.getElementById('landing-stats');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.round(target * eased));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return value;
}

const words = ['Confianza', 'Claridad', 'Disciplina', 'Propósito', 'Liderazgo'];

export function useRotatingWord(interval = 2200): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [interval]);
  return words[index];
}

'use client';

import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 80; // px der skal trækkes ned før refresh udløses

export function PullToRefresh() {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0); // 0–1
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || window.scrollY > 0) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPull(Math.min(delta / THRESHOLD, 1));
      }
    };

    const onTouchEnd = () => {
      if (pull >= 1) {
        setRefreshing(true);
        setTimeout(() => window.location.reload(), 300);
      } else {
        setPull(0);
        startY.current = null;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pull]);

  if (pull === 0 && !refreshing) return null;

  const size = 28;
  const progress = refreshing ? 1 : pull;
  const circumference = Math.PI * (size - 4);
  const dashOffset = circumference * (1 - progress);
  const rotation = refreshing ? 'animate-spin' : '';

  return (
    <div
      style={{
        position: 'fixed',
        top: `${refreshing ? 16 : Math.max(pull * 56 - 40, -40)}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        opacity: pull > 0.2 ? 1 : pull / 0.2,
        transition: refreshing ? 'top 0.2s ease' : undefined,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'var(--color-surface, #fff)',
        borderRadius: '50%',
        width: size + 8,
        height: size + 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={rotation}
          style={{ display: 'block' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 4) / 2}
            fill="none"
            stroke="var(--color-brand, #1e4d8c)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      </div>
    </div>
  );
}

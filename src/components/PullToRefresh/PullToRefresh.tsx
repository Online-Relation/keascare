'use client';

import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 72;

export function PullToRefresh() {
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [translateY, setTranslateY] = useState(-56);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Deaktiver browserens native pull-to-refresh
    document.body.style.overscrollBehaviorY = 'none';

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) return;
      if (window.scrollY > 0) return;

      pulling.current = true;
      setVisible(true);

      // Dæmpet træk: fuld drag = halvt offset
      const clamped = Math.min(delta * 0.5, THRESHOLD);
      setTranslateY(clamped - 56);
    };

    const onTouchEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;

      setTranslateY((prev) => {
        if (prev >= 0) {
          // Nok træk — vis spinner og reload
          setIsRefreshing(true);
          setTimeout(() => window.location.reload(), 600);
          return 8;
        }
        // For lidt træk — spring tilbage
        setTimeout(() => setVisible(false), 250);
        return -56;
      });
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.body.style.overscrollBehaviorY = '';
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px)`,
        transition: pulling.current ? 'none' : 'transform 0.25s ease',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isRefreshing ? (
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: 'ptr-spin 0.7s linear infinite' }}>
            <circle cx="11" cy="11" r="9" fill="none" stroke="#1e4d8c" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="10" strokeLinecap="round" />
            <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); transform-origin: 11px 11px; } }`}</style>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="9" fill="none" stroke="#1e4d8c" strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 9}`}
              strokeDashoffset={`${2 * Math.PI * 9 * (1 - Math.max(0, (translateY + 56) / 56))}`}
              strokeLinecap="round"
              transform="rotate(-90 11 11)"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

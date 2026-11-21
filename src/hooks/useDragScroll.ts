'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Shared horizontal drag-to-scroll helper for carousels.
 * Supports desktop mouse drag-and-hold while preserving native touch swiping
 * and preventing accidental link navigation after dragging > 6px.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const scrollRef = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const stateRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    // Only grab-scroll with primary mouse button (touch uses native fluid swipe + pointer events if needed)
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Do not hijack interactive button clicks inside cards
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, select, textarea')) return;

    const el = scrollRef.current;
    if (!el) return;

    stateRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const st = stateRef.current;
    const el = scrollRef.current;
    if (!st.active || !el) return;

    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 6) {
      st.moved = true;
    }
    if (e.pointerType === 'mouse') {
      el.scrollLeft = st.startScrollLeft - dx;
    }
  }, []);

  const stopDragging = useCallback(() => {
    if (!stateRef.current.active) return;
    stateRef.current.active = false;
    setIsDragging(false);
    setTimeout(() => {
      stateRef.current.moved = false;
    }, 50);
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (stateRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const dragProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp: stopDragging,
    onPointerCancel: stopDragging,
    onPointerLeave: stopDragging,
    onClickCapture,
    onDragStart: (e: React.DragEvent<T>) => e.preventDefault(),
  };

  return { scrollRef, isDragging, dragProps };
}

'use client';

import { useEffect, type RefObject } from 'react';

// Closes an open dropdown when the user clicks/taps anywhere outside `ref`.
// More reliable than a full-screen `<div className="fixed inset-0" onClick=.../>`
// overlay: that overlay's stacking position depends on the ancestor it's
// rendered inside (e.g. one nested in a `position: sticky` header can end up
// stacked below unrelated page content that isn't itself positioned,
// silently swallowing "outside" clicks instead of closing the menu). A
// document-level listener has no such stacking dependency.
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, onOutside, active]);
}

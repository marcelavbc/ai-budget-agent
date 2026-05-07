"use client";

import { useEffect, type RefObject } from "react";

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClickOutside: () => void
) {
  useEffect(() => {
    if (!active) return;

    function onPointerDown(e: PointerEvent) {
      const root = ref.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      onClickOutside();
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [active, ref, onClickOutside]);
}

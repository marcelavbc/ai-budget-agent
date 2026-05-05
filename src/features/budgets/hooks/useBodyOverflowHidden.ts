"use client";

import { useEffect } from "react";

export function useBodyOverflowHidden(overflowValue: string = "hidden") {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = overflowValue;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overflowValue]);
}


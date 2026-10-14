"use client";

import { useCallback, useEffect, useRef } from "react";
import { createCardCarousel } from "@/lib/carousel-controller";

export function useCardCarousel() {
  const rail = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createCardCarousel> | null>(null);
  useEffect(() => {
    if (!rail.current) return;
    const instance = createCardCarousel(rail.current);
    controller.current = instance;
    return () => { instance.destroy(); controller.current = null; };
  }, []);
  const move = useCallback((direction: -1 | 1) => controller.current?.move(direction), []);
  return { rail, move };
}

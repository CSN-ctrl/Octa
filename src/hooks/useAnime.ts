import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

export function useAnime() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const targets = root.querySelectorAll(".anime-card");
    if (!targets.length) return;

    animate(targets, {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(100),
      duration: 600,
      ease: "out(4)",
    });
  }, []);

  return containerRef;
}

export function animateNumber(
  element: HTMLElement | null,
  from: number,
  to: number,
  duration: number = 2000,
  decimals: number = 2
) {
  if (!element) return;

  const state = { value: from };
  animate(state, {
    value: to,
    duration,
    ease: "out(4)",
    onUpdate: () => {
      element.textContent = state.value.toFixed(decimals);
    },
  });
}

export function animateCardHover(element: HTMLElement | null, isHovering: boolean) {
  if (!element) return;

  animate(element, {
    scale: isHovering ? 1.05 : 1,
    boxShadow: isHovering
      ? "0 10px 40px rgba(139, 92, 246, 0.3)"
      : "0 2px 10px rgba(139, 92, 246, 0.1)",
    duration: 300,
    ease: "out(2)",
  });
}

export function animateGlow(element: HTMLElement | null, intensity: number = 1) {
  if (!element) return;

  animate(element, {
    boxShadow: [
      `0 0 ${10 * intensity}px rgba(139, 92, 246, ${0.3 * intensity})`,
      `0 0 ${20 * intensity}px rgba(139, 92, 246, ${0.5 * intensity})`,
      `0 0 ${10 * intensity}px rgba(139, 92, 246, ${0.3 * intensity})`,
    ],
    duration: 2000,
    ease: "inOut(2)",
    loop: true,
  });
}

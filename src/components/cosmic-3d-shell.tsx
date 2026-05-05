import styled from "styled-components";

/**
 * 3D perspective shell for footer social buttons + Chaos Star logo plate.
 * Descendant classes: `.parent`, `.child`, `.child-1`…`.child-4`, `.child-logo`, `.button`, etc.
 */
export const Cosmic3dShell = styled.div`
  width: 100%;

  &.cosmic-3d-shell--fit {
    width: auto;
  }

  .parent {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    perspective: 720px;
    perspective-origin: 50% 35%;
    transform-style: preserve-3d;
    padding-block: 24px;
  }

  .parent > * {
    transform-style: preserve-3d;
  }

  .parent--logo {
    padding-block: 8px 20px;
  }

  .parent--logo-inline {
    width: auto;
    height: auto;
    padding-block: 0;
    padding-inline: 0;
    flex-wrap: nowrap;
  }

  .child {
    width: 50px;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transform-style: preserve-3d;
    transition: color 0.35s ease;
    border-radius: 50%;
    margin: 0 5px;
    color: hsl(var(--muted-foreground));
    text-decoration: none;
  }

  .child::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: hsl(260 24% 7% / 0.55);
    border: 1px solid hsl(260 22% 100% / 0.1);
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    transform-style: preserve-3d;
    transition:
      transform 0.5s ease-in-out,
      box-shadow 0.5s ease-in-out,
      background-color 0.5s ease-in-out,
      border-color 0.5s ease-in-out;
    box-shadow:
      inset 1px 1px 2px rgba(255, 255, 255, 0.22),
      0 0 8px rgba(0, 0, 0, 0.2);
  }

  .child:hover::before {
    background-color: white;
    background-position:
      -100px 100px,
      -100px 100px;
    transform: perspective(180px) rotateX(60deg) translateY(2px);
  }

  .child-logo {
    width: 68px;
    height: 68px;
    border-radius: 12px;
    margin: 0;
    filter: drop-shadow(0 4px 14px hsl(262 72% 32% / 0.42))
      drop-shadow(0 8px 28px hsl(268 65% 44% / 0.28));
  }

  .child-logo:hover {
    filter: drop-shadow(0 6px 18px hsl(262 72% 32% / 0.48))
      drop-shadow(0 12px 36px hsl(268 65% 44% / 0.34));
  }

  @keyframes footer-logo-purple-glow {
    0%,
    100% {
      box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.15) inset,
        0 0 0 1px rgba(232, 220, 180, 0.09) inset,
        0 4px 24px -6px hsl(262 72% 32% / 0.48),
        0 0 20px -4px hsl(268 65% 44% / 0.22);
    }
    50% {
      box-shadow:
        0 1px 0 0 rgba(255, 255, 255, 0.17) inset,
        0 0 0 1px rgba(232, 220, 180, 0.11) inset,
        0 6px 28px -6px hsl(262 72% 32% / 0.55),
        0 0 28px -4px hsl(268 65% 44% / 0.3);
    }
  }

  .child-logo::before {
    border-radius: 12px;
    background: linear-gradient(135deg, hsl(262 72% 52%), hsl(268 65% 50%));
    border: 1px solid hsl(0 0% 100% / 0.11);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.15) inset,
      0 0 0 1px rgba(232, 220, 180, 0.09) inset,
      0 4px 24px -6px hsl(262 72% 32% / 0.52);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    animation: footer-logo-purple-glow 2.6s ease-in-out infinite;
  }

  .child-logo:hover::before {
    animation: none;
    background: linear-gradient(135deg, hsl(262 72% 56%), hsl(268 65% 54%));
    border-color: hsl(0 0% 100% / 0.14);
    transform: perspective(180px) rotateX(60deg) translateY(2px);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.17) inset,
      0 0 0 1px rgba(232, 220, 180, 0.12) inset,
      0 10px 36px -8px hsl(268 65% 44% / 0.38);
  }

  /* Header logo: smaller plate, same look, no pulse / 3D motion */
  .child-logo--nav,
  .child-logo--nav:hover {
    filter: none;
    width: 52px;
    height: 52px;
    border-radius: 10px;
  }

  .child-logo--nav::before {
    animation: none;
    transition: none;
    border-radius: 10px;
  }

  .child-logo--nav:hover::before {
    transform: none;
    background: linear-gradient(135deg, hsl(262 72% 52%), hsl(268 65% 50%));
    border-color: hsl(0 0% 100% / 0.11);
    box-shadow:
      0 1px 0 0 rgba(255, 255, 255, 0.15) inset,
      0 0 0 1px rgba(232, 220, 180, 0.09) inset,
      0 4px 24px -6px hsl(262 72% 32% / 0.52);
  }

  .child.child-logo--nav:hover .button {
    transform: none;
  }

  .child-logo .button {
    border-radius: 12px;
  }

  .child-logo--nav .button {
    transition: none;
    will-change: auto;
    border-radius: 10px;
  }

  .child-1:hover::before {
    box-shadow: 0 10px 10px rgba(255, 255, 255, 0.4);
  }

  .child-2:hover::before {
    box-shadow: 0 10px 12px rgba(255, 69, 0, 0.65);
  }

  .child-3:hover::before {
    box-shadow:
      0 10px 12px rgba(221, 42, 123, 0.5),
      0 6px 10px rgba(129, 52, 175, 0.35);
  }

  .child-4:hover::before {
    box-shadow:
      0 10px 14px rgba(238, 29, 82, 0.55),
      0 6px 12px rgba(105, 201, 208, 0.35);
  }

  .button {
    width: inherit;
    height: inherit;
    border: none;
    background-color: transparent;
    font-size: 20px;
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    transform-style: preserve-3d;
    transition: transform 0.5s ease-in-out;
    border-radius: 50%;
    pointer-events: none;
    will-change: transform;
  }

  .footer-social-icon,
  .footer-social-icon svg {
    width: 1.25rem;
    height: 1.25rem;
    transform-style: preserve-3d;
    transition: transform 0.5s ease-in-out;
    will-change: transform;
  }

  .child:hover .button {
    transform: translate3d(0, -26px, 52px) scale(1.28);
  }

  .child:hover .footer-social-icon {
    transform: translate3d(0, -4px, 18px) scale(1.08);
  }

  @media (prefers-reduced-motion: reduce) {
    .child,
    .button,
    .footer-social-icon,
    .footer-social-icon svg {
      transition-duration: 0.01ms;
    }

    .child-logo::before {
      animation: none;
    }

    .child:hover::before,
    .child:hover .button,
    .child:hover .footer-social-icon {
      transform: none;
    }
  }
`;

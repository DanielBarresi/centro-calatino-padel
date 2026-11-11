// Icone disegnate a mano: stesso tratto (1.75) e stessa griglia 24×24 per tutte
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

// Campo da padel visto dall'alto
export const CourtIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="1.5" />
    <path d="M5 12h14M5 7h14M5 17h14M12 7v10" />
  </svg>
);

export const BallIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.8c3.2 2.9 3.2 9.5 0 12.4M18.4 5.8c-3.2 2.9-3.2 9.5 0 12.4" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const MoonIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

export const TagIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);

export const RoofIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 11 12 4l9 7M5.5 9.5V20h13V9.5" />
  </svg>
);

export const SunIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const AlertIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </svg>
);

export const ArrowIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

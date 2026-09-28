/* Hand-drawn SVG icon & token emblem set for Azuralimit. Zero emoji. */

import type React from "react";

interface P {
  className?: string;
  style?: React.CSSProperties;
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconLogo({ className, style }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden>
      <rect x="2" y="2" width="44" height="44" rx="6" fill="#002147" stroke="#D2B48C" strokeWidth="1.75" />
      <rect x="9" y="9" width="13" height="13" fill="#C47623" />
      <rect x="26" y="9" width="13" height="13" fill="#124D95" />
      <rect x="9" y="26" width="13" height="13" fill="#00594E" />
      <rect x="26" y="26" width="13" height="13" fill="#781C2E" />
      <path d="M24 3v42M3 24h42" stroke="#F9F6EE" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <circle cx="24" cy="24" r="2.6" fill="#FFF6E4" stroke="#002147" strokeWidth="1.2" />
    </svg>
  );
}

export const IconUpload = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 16V4m0 0 4.2 4.2M12 4 7.8 8.2" />
    <path d="M4 15v4h16v-4" />
  </svg>
);

export const IconGrid = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" />
    <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
  </svg>
);

export const IconScissors = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <circle cx="6" cy="6.5" r="2.6" />
    <circle cx="6" cy="17.5" r="2.6" />
    <path d="M8.2 8.1 20 17.8M8.2 15.9 20 6.2" />
  </svg>
);

export const IconDownload = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 4v12m0 0 4.2-4.2M12 16l-4.2-4.2" />
    <path d="M4 15v4h16v-4" />
  </svg>
);

export const IconBox = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
    <path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" />
    <path d="M7.8 5.5 16.2 9.5" opacity="0.6" />
  </svg>
);

export const IconCopy = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M5.5 15.5h-1a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const IconQr = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" />
    <rect x="14" y="3.5" width="6.5" height="6.5" />
    <rect x="3.5" y="14" width="6.5" height="6.5" />
    <path d="M14 14h3v3h-3zM17 17h3.5v3.5H17zM14 20.5h1.5" />
  </svg>
);

export const IconExternal = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M11 6H5.5A1.5 1.5 0 0 0 4 7.5v11A1.5 1.5 0 0 0 5.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
  </svg>
);

export const IconHeartStamp = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 20.2s-7-4.35-7-9.6A4.1 4.1 0 0 1 9.2 6.5c1.35 0 2.3.65 2.8 1.55.5-.9 1.45-1.55 2.8-1.55A4.1 4.1 0 0 1 19 10.6c0 5.25-7 9.6-7 9.6Z" />
  </svg>
);

export const IconTrash = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2" />
    <path d="M6.5 6.5 7.2 19.5h9.6l.7-13" />
    <path d="M10 10.5v6M14 10.5v6" opacity="0.7" />
  </svg>
);

export const IconCheck = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="m4.5 12.5 4.8 4.8L19.5 7" />
  </svg>
);

export const IconX = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IconPlus = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
);

export const IconMinus = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M5.5 12h13" />
  </svg>
);

export const IconSound = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5H4Z" />
    <path d="M15.5 9a4.4 4.4 0 0 1 0 6M18 6.8a8 8 0 0 1 0 10.4" />
  </svg>
);

export const IconMute = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5H4Z" />
    <path d="m15.5 9.5 5 5m0-5-5 5" />
  </svg>
);

export const IconImage = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <rect x="3.5" y="4.5" width="17" height="15" />
    <circle cx="8.8" cy="9.8" r="1.6" />
    <path d="m4.5 17.5 4.8-4.4 4.8 4.8M13.5 15.5l2.3-2.1 3.7 3.7" />
  </svg>
);

export const IconSliders = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M5 4.5v6m0 4v5m7-15v3m0 4v8m7-15v9m0 4v2" />
    <circle cx="5" cy="12.5" r="1.8" />
    <circle cx="12" cy="9.5" r="1.8" />
    <circle cx="19" cy="15.5" r="1.8" />
  </svg>
);

export const IconWarn = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.4M12 17.2v.1" />
  </svg>
);

export const IconSpark = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M12 3.5c.7 3.8 2.7 5.8 6.5 6.5-3.8.7-5.8 2.7-6.5 6.5-.7-3.8-2.7-5.8-6.5-6.5 3.8-.7 5.8-2.7 6.5-6.5Z" />
    <path d="M18.8 15.2c.35 1.9 1.35 2.9 3.2 3.25-1.85.35-2.85 1.35-3.2 3.25-.35-1.9-1.35-2.9-3.2-3.25 1.85-.35 2.85-1.35 3.2-3.25Z" opacity="0.7" />
  </svg>
);

export const IconRefresh = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.6 3.8v3.4h-3.4" />
  </svg>
);

export const IconBolt = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" />
  </svg>
);

export const IconExpand = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
  </svg>
);

export const IconSpinner = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="none" aria-hidden>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.4" />
    <path d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const IconChevronL = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

export const IconChevronR = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);

export const IconSync = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" className={className} style={style} {...S} aria-hidden>
    <path d="M17 4.5 20 7.5l-3 3" />
    <path d="M20 7.5H6.5v3.5" />
    <path d="M7 19.5l-3-3 3-3" />
    <path d="M4 16.5h13.5V13" />
  </svg>
);

/* ---------- Custom hand-crafted payment & token emblems ---------- */

export const EmblemDana = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <rect x="2" y="5" width="28" height="22" rx="4" fill="#124D95" stroke="#E9F5FF" strokeWidth="1.5" />
    <path d="M8 16c2.6-2.8 5.4-2.8 8 0s5.4 2.8 8 0" stroke="#FFF6E4" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="8.5" cy="11" r="1.4" fill="#D2B48C" />
    <circle cx="23.5" cy="21" r="1.4" fill="#D2B48C" />
  </svg>
);

export const EmblemUsdt = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="#00594E" stroke="#D2B48C" strokeWidth="1.5" />
    <path d="M10 10.5h12M16 10.5v13" stroke="#FFF6E4" strokeWidth="2.2" strokeLinecap="round" />
    <ellipse cx="16" cy="15.2" rx="6.5" ry="2" stroke="#D2B48C" strokeWidth="1.4" />
  </svg>
);

export const EmblemEth = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <rect x="3" y="3" width="26" height="26" rx="5" fill="#002147" stroke="#D2B48C" strokeWidth="1.5" />
    <polygon points="16,5.5 22.5,16 16,19.5 9.5,16" fill="#E9F5FF" fillOpacity="0.9" />
    <polygon points="16,21.2 22.5,17.5 16,26.5 9.5,17.5" fill="#D2B48C" />
  </svg>
);

export const EmblemBnb = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <rect x="3" y="3" width="26" height="26" rx="5" fill="#352323" stroke="#C47623" strokeWidth="1.5" />
    <path d="M16 7.5 20.2 11.7 18.4 13.5 16 11.1 13.6 13.5 11.8 11.7 16 7.5Z" fill="#FFF6E4" />
    <path d="M16 24.5 11.8 20.3 13.6 18.5 16 20.9 18.4 18.5 20.2 20.3 16 24.5Z" fill="#FFF6E4" />
    <rect x="8.2" y="14.2" width="3.6" height="3.6" transform="rotate(45 10 16)" fill="#C47623" />
    <rect x="20.2" y="14.2" width="3.6" height="3.6" transform="rotate(45 22 16)" fill="#C47623" />
    <rect x="14.2" y="14.2" width="3.6" height="3.6" transform="rotate(45 16 16)" fill="#D2B48C" />
  </svg>
);

export const EmblemMatic = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <rect x="3" y="3" width="26" height="26" rx="5" fill="#781C2E" stroke="#D2B48C" strokeWidth="1.5" />
    <path
      d="M20.5 12.2 17 10.2l-3.5 2v4l7 4 3.5-2v-4l-3.5-2-3.5 2M11.5 19.8 15 21.8l3.5-2v-4l-7-4-3.5 2v4l3.5 2"
      stroke="#FFF6E4"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EmblemPepe = ({ className, style }: P) => (
  <svg viewBox="0 0 32 32" className={className} style={style} fill="none" aria-hidden>
    <rect x="3" y="3" width="26" height="26" rx="5" fill="#00594E" stroke="#C47623" strokeWidth="1.5" />
    <circle cx="12" cy="12.5" r="3.2" fill="#FFF6E4" stroke="#002147" strokeWidth="1.3" />
    <circle cx="20" cy="12.5" r="3.2" fill="#FFF6E4" stroke="#002147" strokeWidth="1.3" />
    <circle cx="12.4" cy="12.5" r="1.2" fill="#002147" />
    <circle cx="20.4" cy="12.5" r="1.2" fill="#002147" />
    <path d="M9.5 19.5c2 2.2 11 2.2 13 0" stroke="#D2B48C" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 22.5h10" stroke="#C47623" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

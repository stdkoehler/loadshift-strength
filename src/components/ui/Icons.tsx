import type { SVGProps } from 'react';

const s = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconDumbbell = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M6.5 6.5l11 11M4 8v8M8 4v8m8 4V8m4 0v8M2 12h2m16 0h2" /></svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 3v18h18M8 15l3-4 3 2 4-6" /></svg>
);
export const IconHistory = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" />
  </svg>
);
export const IconEdit = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" /></svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
export const IconDownload = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 21V9m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconLogo = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <path d="M4 18l8-6 8 6" opacity="0.35" />
    <path d="M4 13l8-6 8 6" opacity="0.65" />
    <path d="M4 8l8-6 8 6" />
  </svg>
);
export const IconTimer = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l3 2M10 2h4" />
  </svg>
);
export const IconBookmark = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
);
export const IconGrip = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} fill="currentColor" stroke="none" {...p}>
    <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
  </svg>
);
export const IconChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);

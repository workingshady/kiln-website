import { useId } from "react";

/** The Kiln mark: a brick dome with a glowing mouth and pixel sparks, cut down from the app icon. */
export function LogoMark({ size = 34, title }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9744d" />
          <stop offset="1" stopColor="#8e4229" />
        </linearGradient>
        <radialGradient id={`m${id}`} cx="0.5" cy="0.85" r="0.9">
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset="0.45" stopColor="#ffc04d" />
          <stop offset="1" stopColor="#ff7a45" />
        </radialGradient>
      </defs>
      <path d="M8 56 C8 32 18 16 32 16 C46 16 56 32 56 56 Z" fill={`url(#b${id})`} />
      <g stroke="#5a2418" strokeWidth="1.3" opacity="0.75">
        <path d="M14.5 30h35M10.7 39h42.6M9 48h46" />
        <path d="M26 16.8v13.2M38 16.8v13.2M20 30v9M32 30v9M44 30v9M15 39v9M49 39v9" />
      </g>
      <path d="M22 56V44a10 10 0 0 1 20 0v12Z" fill="#3b1a14" />
      <path d="M24 56V44.5a8 8 0 0 1 16 0V56Z" fill={`url(#m${id})`} />
      <rect x="5" y="55" width="54" height="4" rx="1.5" fill="#3b1a14" />
      <rect x="29" y="8" width="6" height="6" fill="#ffc04d" />
      <rect x="22" y="3" width="4" height="4" fill="#ff6f9b" />
      <rect x="38" y="2" width="3.5" height="3.5" fill="#ffd66b" />
    </svg>
  );
}

export function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.82 1.23.82.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function WindowsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M0 2.2 6.5 1.3v6.2H0V2.2Zm7.3-1L16 0v7.5H7.3V1.2ZM0 8.3h6.5v6.3L0 13.7V8.3Zm7.3 0H16V16l-8.7-1.2V8.3Z" />
    </svg>
  );
}

export function AppleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.18 8.5c-.02-1.7 1.39-2.52 1.45-2.56-.79-1.16-2.02-1.31-2.46-1.33-1.04-.11-2.04.62-2.57.62-.53 0-1.35-.6-2.22-.59A3.3 3.3 0 0 0 2.6 6.33c-1.19 2.06-.3 5.1.85 6.77.57.82 1.24 1.73 2.12 1.7.85-.03 1.17-.55 2.2-.55 1.02 0 1.31.55 2.21.53.92-.01 1.5-.83 2.05-1.65.65-.95.92-1.87.93-1.92-.02-.01-1.78-.68-1.8-2.71ZM9.5 3.5c.47-.57.78-1.35.7-2.14-.67.03-1.49.45-1.97 1.01-.43.5-.81 1.3-.71 2.07.75.06 1.51-.38 1.98-.94Z" />
    </svg>
  );
}

export function CodeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 4 1 8l4 4M11 4l4 4-4 4M9.5 2.5l-3 11" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 2v10M3.5 8 8 12.5 12.5 8M2 15h12" strokeLinecap="square" />
    </svg>
  );
}

const PATHS = {
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  plan: "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8 12h8M8 16h5",
  add: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8v8M8 12h8",
  progress: "M3 17l6-6 4 4 8-8M15 7h6v6",
  me: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8M4 21a8 8 0 0 1 16 0",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  back: "M15 6l-6 6 6 6",
  next: "M9 6l6 6-6 6",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  bowl: "M4 11h16a8 8 0 0 1-16 0zM8 4c0 2 2 2 2 4M12 4c0 2 2 2 2 4",
  run: "M13 4a2 2 0 1 0 0 .01M7 21l3-6 3 2v5M10 15l1-5 4 2 3-1M8 11l3-2",
  calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 11h18",
  heart: "M12 21s-7-4.4-9.3-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9z",
  sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5 9-10",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10",
  cart: "M3 4h2l2.4 11h11L21 7H6M9 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className, strokeWidth = 1.8 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Card heading with an outlined icon tile, as used across the app. */
export function CardTitle({ icon, children, action }: { icon: IconName; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="icon-tile">
          <Icon name={icon} />
        </span>
        <h2 className="text-[19px] font-bold">{children}</h2>
      </div>
      {action}
    </div>
  );
}

"use client";

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 rounded-full border px-3.5 text-sm font-medium ${
        active ? "border-baby bg-baby text-app" : "border-line bg-transparent text-soft hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

/** 1–5 rating buttons. */
export function Scale({
  value,
  onChange,
  label,
  color = "baby",
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  label: string;
  color?: "baby" | "blush";
}) {
  const on = color === "blush" ? "border-blush bg-blush text-app" : "border-baby bg-baby text-app";
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${label} ${n}`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? null : n)}
          className={`h-10 rounded-xl border text-[15px] font-semibold ${value === n ? on : "border-line text-soft hover:border-muted"}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[30px] w-[50px] shrink-0 items-center rounded-full p-[3px] ${checked ? "justify-end bg-blush" : "justify-start bg-[#2E3B57]"}`}
    >
      <span className="h-6 w-6 rounded-full bg-white" />
    </button>
  );
}

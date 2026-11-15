"use client";

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active ? "border-rose-700 bg-rose-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-rose-300"
      }`}
    >
      {children}
    </button>
  );
}

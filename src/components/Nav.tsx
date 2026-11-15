"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/today", label: "Today", icon: "home" },
  { href: "/plan", label: "Plan", icon: "plan" },
  { href: "/log", label: "Log food", icon: "add" },
  { href: "/progress", label: "Progress", icon: "progress" },
  { href: "/consultation", label: "Me", icon: "me" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line-soft bg-bar pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid h-[68px] max-w-xl grid-cols-5 items-center">
        {LINKS.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${active ? "text-baby" : "text-muted hover:text-soft"}`}
              >
                <Icon name={l.icon} size={24} />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

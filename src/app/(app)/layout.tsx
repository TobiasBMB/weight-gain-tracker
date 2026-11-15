import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/Nav";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line-soft bg-app/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
          <Link href="/today" className="text-xl font-extrabold tracking-tight">
            Nourish
          </Link>
          <Link href="/reminders" aria-label="Reminders" className="-mr-2 flex h-11 w-11 items-center justify-center text-fg hover:text-baby">
            <Icon name="bell" size={22} />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-32 pt-4">{children}</main>
      <Nav />
    </div>
  );
}

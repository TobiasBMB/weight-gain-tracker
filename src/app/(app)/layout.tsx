import Link from "next/link";
import { Nav } from "@/components/Nav";
import { signOut } from "../login/actions";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="mb-5 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-rose-900">Nourish</span>
        <div className="flex items-center gap-4">
          <Link href="/reminders" className="text-sm text-stone-600 hover:text-stone-900">
            🔔 Reminders
          </Link>
          <form action={signOut}>
            <button className="text-sm text-stone-500 hover:text-stone-800">Sign out</button>
          </form>
        </div>
      </header>
      {children}
      <Nav />
    </div>
  );
}

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { dayKey, formatDay } from "@/lib/dates";
import { FoodForm } from "../today/forms";

export default async function LogPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const params = await searchParams;
  const today = dayKey();
  const day = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) && params.day <= today ? params.day : today;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-1">
        <Link href={`/today?day=${day}`} aria-label="Back to Today" className="-ml-2 flex h-11 w-11 items-center justify-center text-fg">
          <Icon name="back" size={22} strokeWidth={2} />
        </Link>
        <h1 className="text-[19px] font-bold">Add food{day === today ? "" : ` · ${formatDay(day)}`}</h1>
      </div>
      <FoodForm day={day} />
    </div>
  );
}

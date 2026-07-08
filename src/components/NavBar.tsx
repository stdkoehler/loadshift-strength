'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDumbbell, IconCalendar, IconChart } from '@/components/ui/Icons';

const TABS = [
  { href: '/training', label: 'Training', Icon: IconDumbbell },
  { href: '/plan', label: 'Plan', Icon: IconCalendar },
  { href: '/progress', label: 'Fortschritt', Icon: IconChart },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="mt-auto flex justify-around border-t border-neutral-800 bg-neutral-950 px-2 pb-[max(theme(spacing.2),env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto flex w-full max-w-[900px]">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold ${active ? 'text-emerald-400' : 'text-neutral-500'}`}
            >
              <span className={`flex h-[30px] w-[46px] items-center justify-center rounded-lg ${active ? 'bg-emerald-500/15' : ''}`}>
                <tab.Icon width={22} height={22} />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

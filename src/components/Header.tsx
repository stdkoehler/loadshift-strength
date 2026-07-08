import { IconLogo } from '@/components/ui/Icons';

export function Header() {
  return (
    <header className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
        <IconLogo width={20} height={20} />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-neutral-100">
        LoadShift <span className="text-emerald-400">Strength</span>
      </span>
    </header>
  );
}

import { Flame, MapPin } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative grid size-9 place-items-center rounded-xl bg-alert text-alert-foreground shadow-soft">
        <Flame className="size-5" strokeWidth={2.4} />
        <MapPin className="absolute -bottom-1 -right-1 size-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight">
            Fire<span className="text-alert">Help</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Informação que protege
          </span>
        </span>
      )}
    </span>
  );
}

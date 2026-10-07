import { ShieldAlert } from "lucide-react";
import { SAFETY_NOTICE } from "@/lib/firehelp";

export function SafetyNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning-foreground ${className}`}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <span>{SAFETY_NOTICE}</span>
    </p>
  );
}

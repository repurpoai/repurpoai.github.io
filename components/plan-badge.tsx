import { Crown, Sparkles } from "lucide-react";
import { type PlanTier } from "@/lib/plans";

type PlanBadgeProps = {
  tier: PlanTier;
};

export function PlanBadge({ tier }: PlanBadgeProps) {
  if (tier === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 shadow-[0_10px_24px_-16px_rgba(251,191,36,0.5)]">
        <Crown className="h-3.5 w-3.5" />
        Pro
      </span>
    );
  }

  if (tier === "plus") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 shadow-[0_10px_24px_-16px_rgba(52,211,153,0.5)]">
        <Sparkles className="h-3.5 w-3.5" />
        Plus
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.4)]">
      Free
    </span>
  );
}
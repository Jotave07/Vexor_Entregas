import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone?: "blue" | "green" | "amber" | "slate" | "rose";
};

const toneMap = {
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  slate: "bg-slate-200 text-slate-700",
  rose: "bg-rose-100 text-rose-700"
};

export function StatusBadge({ label, tone = "slate" }: StatusBadgeProps) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", toneMap[tone])}>{label}</span>;
}

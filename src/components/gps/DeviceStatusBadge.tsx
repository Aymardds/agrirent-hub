import { cn } from "@/lib/utils";

export type DeviceStatus = "online" | "offline" | "low_battery" | "inactive";

interface DeviceStatusBadgeProps {
  status: DeviceStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusConfig: Record<DeviceStatus, { label: string; dotClass: string; textClass: string; bgClass: string; pulse: boolean }> = {
  online: {
    label: "En ligne",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-200",
    pulse: true,
  },
  offline: {
    label: "Hors ligne",
    dotClass: "bg-red-500",
    textClass: "text-red-700",
    bgClass: "bg-red-50 border-red-200",
    pulse: false,
  },
  low_battery: {
    label: "Batterie faible",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
    pulse: true,
  },
  inactive: {
    label: "Inactif",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50 border-slate-200",
    pulse: false,
  },
};

const sizeClasses = {
  sm: { badge: "px-2 py-0.5 text-[10px] gap-1", dot: "w-1.5 h-1.5" },
  md: { badge: "px-2.5 py-1 text-xs gap-1.5", dot: "w-2 h-2" },
  lg: { badge: "px-3 py-1.5 text-sm gap-2", dot: "w-2.5 h-2.5" },
};

export const DeviceStatusBadge = ({
  status,
  showLabel = true,
  size = "md",
  className,
}: DeviceStatusBadgeProps) => {
  const config = statusConfig[status];
  const sz = sizeClasses[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        sz.badge,
        config.bgClass,
        config.textClass,
        className
      )}
    >
      <span className="relative flex">
        {config.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              config.dotClass
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full", sz.dot, config.dotClass)} />
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

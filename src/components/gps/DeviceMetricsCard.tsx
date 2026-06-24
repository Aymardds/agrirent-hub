import { Battery, Signal, Clock, Wifi, WifiOff, Zap, Thermometer, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeviceStatusBadge, DeviceStatus } from "./DeviceStatusBadge";
import { cn } from "@/lib/utils";

export interface GpsDevice {
  id: string;
  imei: string;
  label: string;
  model: "FMB920";
  status: DeviceStatus;
  equipment_id?: string;
  equipment_name?: string;
  battery_level: number;       // %
  signal_strength: number;     // 0-5
  last_seen?: string;          // ISO timestamp
  last_lat?: number;
  last_lng?: number;
  last_speed?: number;         // km/h
  server_ip: string;
  server_port: number;
  ping_interval: number;       // seconds
  apn: string;
  bluetooth_pin: string;
  geofence_enabled: boolean;
  geofence_radius_km?: number;
  alert_speed_limit?: number;
  alert_ignition: boolean;
  created_at: string;
}

interface DeviceMetricsCardProps {
  device: GpsDevice;
  onConfigure?: (device: GpsDevice) => void;
  onDelete?: (device: GpsDevice) => void;
  className?: string;
}

const BatteryIcon = ({ level }: { level: number }) => {
  const color =
    level > 60 ? "text-emerald-500" :
    level > 20 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1">
      <Battery className={cn("w-4 h-4", color)} />
      <span className={cn("text-xs font-semibold", color)}>{level}%</span>
    </div>
  );
};

const SignalBars = ({ strength }: { strength: number }) => {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-1.5 rounded-sm transition-colors",
            bar <= strength ? "bg-emerald-500" : "bg-slate-200"
          )}
          style={{ height: `${bar * 3 + 4}px` }}
        />
      ))}
    </div>
  );
};

const formatLastSeen = (timestamp?: string): string => {
  if (!timestamp) return "Jamais";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `Il y a ${Math.floor(diffHours / 24)}j`;
};

export const DeviceMetricsCard = ({ device, onConfigure, onDelete, className }: DeviceMetricsCardProps) => {
  return (
    <Card className={cn("p-4 flex flex-col gap-3 border-border hover:shadow-md transition-shadow", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{device.label}</p>
            <p className="text-[11px] text-muted-foreground font-mono">IMEI: {device.imei}</p>
          </div>
        </div>
        <DeviceStatusBadge status={device.status} size="sm" />
      </div>

      {/* Equipment association */}
      {device.equipment_name && (
        <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs">
          <span className="text-muted-foreground">Engin associé : </span>
          <span className="font-medium text-foreground">{device.equipment_name}</span>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Batterie</span>
          <BatteryIcon level={device.battery_level} />
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Signal GSM</span>
          <SignalBars strength={device.signal_strength} />
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Dernière trame</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{formatLastSeen(device.last_seen)}</span>
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Vitesse</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              {device.last_speed !== undefined ? `${device.last_speed} km/h` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Server info */}
      <div className="border-t pt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {device.status === "online" ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className="font-mono">{device.server_ip}:{device.server_port}</span>
        </div>
        <span>Ping: {device.ping_interval}s</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          onClick={() => onConfigure?.(device)}
        >
          Configurer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete?.(device)}
        >
          Retirer
        </Button>
      </div>
    </Card>
  );
};

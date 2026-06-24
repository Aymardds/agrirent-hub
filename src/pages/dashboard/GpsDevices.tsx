import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeviceStatusBadge, DeviceStatus } from "@/components/gps/DeviceStatusBadge";
import { DeviceMetricsCard, GpsDevice } from "@/components/gps/DeviceMetricsCard";
import { DeviceConfigStepper } from "@/components/gps/DeviceConfigStepper";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Satellite,
  Plus,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  Cpu,
  Activity,
  WifiOff,
  Battery,
  Filter,
  X,
  ArrowLeft,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Simulated seed data (replace with Supabase fetch once table exists) ──────
const SEED_DEVICES: GpsDevice[] = [
  {
    id: "dev-1",
    imei: "352093081234001",
    label: "Tracteur Nord-01",
    model: "FMB920",
    status: "online",
    equipment_id: "eq-1",
    equipment_name: "John Deere 5075E",
    battery_level: 85,
    signal_strength: 4,
    last_seen: new Date(Date.now() - 2 * 60000).toISOString(),
    last_lat: 6.8310,
    last_lng: -5.2870,
    last_speed: 12,
    server_ip: "traccar.agrirent.ci",
    server_port: 5027,
    ping_interval: 30,
    apn: "mtn.ci",
    bluetooth_pin: "5555",
    geofence_enabled: true,
    geofence_radius_km: 10,
    alert_speed_limit: 80,
    alert_ignition: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "dev-2",
    imei: "352093081234002",
    label: "Moissonneuse Sud-02",
    model: "FMB920",
    status: "low_battery",
    equipment_id: "eq-2",
    equipment_name: "Claas Dominator 130",
    battery_level: 14,
    signal_strength: 3,
    last_seen: new Date(Date.now() - 15 * 60000).toISOString(),
    last_lat: 4.7510,
    last_lng: -6.6330,
    last_speed: 0,
    server_ip: "traccar.agrirent.ci",
    server_port: 5027,
    ping_interval: 60,
    apn: "moov.ci",
    bluetooth_pin: "5555",
    geofence_enabled: false,
    alert_speed_limit: 60,
    alert_ignition: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "dev-3",
    imei: "352093081234003",
    label: "Pulvérisateur Bouaké-01",
    model: "FMB920",
    status: "offline",
    battery_level: 0,
    signal_strength: 0,
    last_seen: new Date(Date.now() - 3 * 3600000).toISOString(),
    last_speed: 0,
    server_ip: "traccar.agrirent.ci",
    server_port: 5027,
    ping_interval: 30,
    apn: "orange.ci",
    bluetooth_pin: "5555",
    geofence_enabled: false,
    alert_speed_limit: 80,
    alert_ignition: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "dev-4",
    imei: "352093081234004",
    label: "Tracteur Korhogo-03",
    model: "FMB920",
    status: "online",
    equipment_name: "Massey Ferguson 385",
    battery_level: 72,
    signal_strength: 5,
    last_seen: new Date(Date.now() - 45000).toISOString(),
    last_lat: 9.4560,
    last_lng: -5.6310,
    last_speed: 8,
    server_ip: "traccar.agrirent.ci",
    server_port: 5027,
    ping_interval: 30,
    apn: "mtn.ci",
    bluetooth_pin: "5555",
    geofence_enabled: true,
    geofence_radius_km: 15,
    alert_speed_limit: 80,
    alert_ignition: true,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

type ViewMode = "grid" | "list";
type FilterStatus = "all" | DeviceStatus;
type ActiveTab = "devices" | "configure" | "monitoring";

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "online", label: "En ligne" },
  { value: "low_battery", label: "Batterie faible" },
  { value: "offline", label: "Hors ligne" },
  { value: "inactive", label: "Inactif" },
];

const GpsDevices = () => {
  const [devices, setDevices] = useState<GpsDevice[]>(SEED_DEVICES);
  const [equipmentList, setEquipmentList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("devices");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [editDevice, setEditDevice] = useState<GpsDevice | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real equipment list from Supabase
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data } = await supabase.from("equipment").select("id, name").order("name");
        if (data) setEquipmentList(data.map((e: any) => ({ id: e.id, name: e.name })));
      } catch (_) {}
    };
    fetchEquipment();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Statuts des dispositifs mis à jour");
    }, 1200);
  };

  const handleDelete = (device: GpsDevice) => {
    setDevices((prev) => prev.filter((d) => d.id !== device.id));
    toast.success(`Dispositif "${device.label}" retiré`);
  };

  const handleConfigure = (device: GpsDevice) => {
    setEditDevice(device);
    setActiveTab("configure");
  };

  const handleSave = (formData: any) => {
    if (editDevice) {
      // Update existing
      setDevices((prev) =>
        prev.map((d) =>
          d.id === editDevice.id
            ? {
                ...d,
                imei: formData.imei,
                label: formData.label,
                bluetooth_pin: formData.bluetooth_pin,
                apn: formData.apn,
                server_ip: formData.server_ip,
                server_port: parseInt(formData.server_port),
                equipment_id: formData.equipment_id,
                equipment_name: equipmentList.find((e) => e.id === formData.equipment_id)?.name,
                ping_interval: parseInt(formData.ping_interval),
                alert_ignition: formData.alert_ignition,
                alert_speed_limit: parseInt(formData.alert_speed_limit),
                geofence_enabled: formData.geofence_enabled,
                geofence_radius_km: formData.geofence_radius_km,
              }
            : d
        )
      );
      toast.success(`Dispositif "${formData.label}" mis à jour`);
    } else {
      // New device
      const newDevice: GpsDevice = {
        id: `dev-${Date.now()}`,
        imei: formData.imei,
        label: formData.label,
        model: "FMB920",
        status: "inactive",
        equipment_id: formData.equipment_id || undefined,
        equipment_name: equipmentList.find((e) => e.id === formData.equipment_id)?.name,
        battery_level: 100,
        signal_strength: 0,
        server_ip: formData.server_ip,
        server_port: parseInt(formData.server_port),
        ping_interval: parseInt(formData.ping_interval),
        apn: formData.apn,
        bluetooth_pin: formData.bluetooth_pin,
        geofence_enabled: formData.geofence_enabled,
        geofence_radius_km: formData.geofence_radius_km,
        alert_speed_limit: parseInt(formData.alert_speed_limit),
        alert_ignition: formData.alert_ignition,
        created_at: new Date().toISOString(),
      };
      setDevices((prev) => [newDevice, ...prev]);
      toast.success(`Dispositif "${formData.label}" enregistré avec succès`);
    }
    setEditDevice(undefined);
    setActiveTab("devices");
  };

  const filteredDevices = devices.filter((d) => {
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    const matchSearch =
      d.label.toLowerCase().includes(search.toLowerCase()) ||
      d.imei.includes(search) ||
      (d.equipment_name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    low_battery: devices.filter((d) => d.status === "low_battery").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2.5">
              <Satellite className="w-6 h-6 text-primary" />
              Dispositifs GPS — Teltonika FMB920
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Configuration et monitoring des trackers 2G installés sur vos engins agricoles
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Actualiser
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => { setEditDevice(undefined); setActiveTab("configure"); }}
            >
              <Plus className="w-4 h-4" />
              Ajouter un tracker
            </Button>
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total trackers", value: stats.total, icon: Cpu, color: "text-foreground", bg: "bg-muted/40" },
            { label: "En ligne", value: stats.online, icon: Activity, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Batterie faible", value: stats.low_battery, icon: Battery, color: "text-amber-700", bg: "bg-amber-50" },
            { label: "Hors ligne", value: stats.offline, icon: WifiOff, color: "text-red-700", bg: "bg-red-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className={cn("p-4 border-none flex items-center gap-3", bg)}>
              <div className={cn("p-2 rounded-lg bg-white/60", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={cn("text-xl font-bold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border gap-1">
          {([
            { id: "devices", label: "Liste des dispositifs" },
            { id: "monitoring", label: "Monitoring" },
            ...(activeTab === "configure" ? [{ id: "configure", label: editDevice ? "Modifier" : "Nouveau tracker" }] : []),
          ] as { id: ActiveTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Devices List ── */}
        {activeTab === "devices" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher IMEI, libellé, engin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-full border font-medium transition-all",
                      filterStatus === f.value
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 ml-auto">
                <Button
                  size="icon"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className="w-9 h-9"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className="w-9 h-9"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Grid view */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDevices.map((device) => (
                  <DeviceMetricsCard
                    key={device.id}
                    device={device}
                    onConfigure={handleConfigure}
                    onDelete={handleDelete}
                  />
                ))}

                {filteredDevices.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    <Satellite className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun dispositif trouvé</p>
                  </div>
                )}
              </div>
            )}

            {/* List view */}
            {viewMode === "list" && (
              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Libellé</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">IMEI</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engin associé</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serveur</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ping</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDevices.map((device, i) => (
                        <tr
                          key={device.id}
                          className={cn(
                            "border-b border-border last:border-0 hover:bg-muted/20 transition-colors",
                            i % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                          )}
                        >
                          <td className="px-4 py-3">
                            <DeviceStatusBadge status={device.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">{device.label}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{device.imei}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {device.equipment_name || <span className="italic text-xs">Non associé</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {device.server_ip}:{device.server_port}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{device.ping_interval}s</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleConfigure(device)}
                              >
                                Configurer
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(device)}
                              >
                                Retirer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredDevices.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                            Aucun dispositif trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Tab: Monitoring ── */}
        {activeTab === "monitoring" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                Les métriques sont mises à jour selon l'intervalle de ping de chaque tracker. Seuls les dispositifs
                avec une connexion active au serveur Traccar envoient des données en temps réel.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {devices
                .filter((d) => d.status !== "inactive")
                .sort((a, b) => {
                  const order: Record<DeviceStatus, number> = { online: 0, low_battery: 1, offline: 2, inactive: 3 };
                  return order[a.status] - order[b.status];
                })
                .map((device) => (
                  <DeviceMetricsCard
                    key={device.id}
                    device={device}
                    onConfigure={handleConfigure}
                    onDelete={handleDelete}
                  />
                ))}

              {devices.filter((d) => d.status !== "inactive").length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucun dispositif actif à monitorer</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Configure ── */}
        {activeTab === "configure" && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground -ml-2"
                  onClick={() => { setEditDevice(undefined); setActiveTab("devices"); }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
                <div className="h-5 w-px bg-border" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {editDevice ? `Modifier : ${editDevice.label}` : "Nouveau dispositif FMB920"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editDevice ? `IMEI : ${editDevice.imei}` : "Ajoutez et configurez un nouveau tracker Teltonika"}
                  </p>
                </div>
              </div>

              <DeviceConfigStepper
                equipmentList={equipmentList}
                editDevice={editDevice}
                onSave={handleSave}
                onCancel={() => { setEditDevice(undefined); setActiveTab("devices"); }}
              />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GpsDevices;

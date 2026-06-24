import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GeofenceMapPicker } from "./GeofenceMapPicker";
import { GpsDevice } from "./DeviceMetricsCard";
import {
  Cpu,
  Wifi,
  Link2,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Bluetooth,
  Server,
  Gauge,
  MapPin,
  KeyRound,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StepId = "identity" | "network" | "association" | "alerts";

const STEPS: { id: StepId; label: string; icon: React.ElementType; description: string }[] = [
  { id: "identity",    label: "Identification",    icon: Cpu,        description: "IMEI et informations du tracker" },
  { id: "network",     label: "Réseau GPRS",        icon: Wifi,       description: "APN, serveur de collecte" },
  { id: "association", label: "Association",         icon: Link2,      description: "Engin et paramètres de tracking" },
  { id: "alerts",      label: "Alertes & Zones",    icon: ShieldCheck,description: "Vitesse, allumage, géofencing" },
];

interface FormData {
  // Step 1 – Identity
  imei: string;
  label: string;
  bluetooth_pin: string;
  // Step 2 – Network
  apn: string;
  apn_username: string;
  apn_password: string;
  server_ip: string;
  server_port: string;
  protocol: "TCP" | "UDP";
  codec: "Codec8" | "Codec8E";
  // Step 3 – Association
  equipment_id: string;
  ping_interval: string;
  sleep_mode: boolean;
  // Step 4 – Alerts
  alert_speed_limit: string;
  alert_ignition: boolean;
  geofence_enabled: boolean;
  geofence_lat: number;
  geofence_lng: number;
  geofence_radius_km: number;
}

const defaultForm: FormData = {
  imei: "",
  label: "",
  bluetooth_pin: "5555",
  apn: "",
  apn_username: "",
  apn_password: "",
  server_ip: "",
  server_port: "5027",
  protocol: "TCP",
  codec: "Codec8",
  equipment_id: "",
  ping_interval: "30",
  sleep_mode: false,
  alert_speed_limit: "80",
  alert_ignition: true,
  geofence_enabled: false,
  geofence_lat: 6.8276,
  geofence_lng: -5.2893,
  geofence_radius_km: 5,
};

interface DeviceConfigStepperProps {
  equipmentList: { id: string; name: string }[];
  editDevice?: Partial<GpsDevice>;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="flex items-center gap-0 mb-8">
    {STEPS.map((step, index) => {
      const Icon = step.icon;
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;
      return (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isCompleted
                  ? "bg-primary border-primary text-white"
                  : isActive
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium text-center leading-tight max-w-[60px]",
                isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-1 mb-5 transition-colors duration-300",
                index < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

// ── Step 1: Identity ───────────────────────────────────────────────
const StepIdentity = ({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label className="text-sm font-medium">IMEI du dispositif <span className="text-red-500">*</span></Label>
      <p className="text-xs text-muted-foreground mb-2">
        Numéro à 15 chiffres imprimé sur le boîtier FMB920 ou trouvé dans le configurateur Teltonika.
      </p>
      <Input
        placeholder="ex: 352093081234567"
        maxLength={15}
        value={form.imei}
        onChange={(e) => set("imei", e.target.value.replace(/\D/g, "").slice(0, 15))}
        className="font-mono tracking-wider"
      />
      <p className={cn("text-[11px] mt-1", form.imei.length === 15 ? "text-emerald-600" : "text-muted-foreground")}>
        {form.imei.length}/15 chiffres
      </p>
    </div>

    <div>
      <Label className="text-sm font-medium">Libellé du tracker <span className="text-red-500">*</span></Label>
      <p className="text-xs text-muted-foreground mb-2">Nom affichable dans le tableau de bord (ex: "Tracteur Nord-01").</p>
      <Input
        placeholder="ex: Tracteur Nord-01"
        value={form.label}
        onChange={(e) => set("label", e.target.value)}
      />
    </div>

    <div>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Bluetooth className="w-4 h-4 text-blue-500" />
        Code PIN Bluetooth
      </Label>
      <p className="text-xs text-muted-foreground mb-2">
        PIN pour se connecter au FMB920 via Teltonika Configurator (défaut : <code className="bg-muted px-1 rounded">5555</code>).
      </p>
      <Input
        placeholder="5555"
        maxLength={10}
        value={form.bluetooth_pin}
        onChange={(e) => set("bluetooth_pin", e.target.value)}
        className="max-w-[160px] font-mono"
      />
    </div>

    {/* Hardware info callout */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3">
      <Cpu className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-blue-800 space-y-1">
        <p className="font-semibold">Teltonika FMB920 — Rappel technique</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li>2G GPRS · GPS/GLONASS/GALILEO · Bluetooth LE 4.0</li>
          <li>1 entrée numérique, 1 sortie numérique, 1 entrée analogique</li>
          <li>Batterie secours 170 mAh · IP54 · Alimentation 6–30V DC</li>
          <li>Codec 8 / Codec 8 Extended · Commandes via Codec 12</li>
        </ul>
      </div>
    </div>
  </div>
);

// ── Step 2: Network ────────────────────────────────────────────────
const StepNetwork = ({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label className="text-sm font-medium">APN opérateur <span className="text-red-500">*</span></Label>
        <p className="text-xs text-muted-foreground mb-2">
          Point d'accès GPRS de votre opérateur (ex: <code className="bg-muted px-1 rounded">internet</code>, <code className="bg-muted px-1 rounded">mtn.ci</code>).
        </p>
        <Input placeholder="internet" value={form.apn} onChange={(e) => set("apn", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium">Utilisateur APN</Label>
          <Input
            placeholder="(vide si non requis)"
            value={form.apn_username}
            onChange={(e) => set("apn_username", e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Mot de passe APN</Label>
          <Input
            type="password"
            placeholder="(vide si non requis)"
            value={form.apn_password}
            onChange={(e) => set("apn_password", e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>

    <div className="border-t pt-4">
      <Label className="text-sm font-medium flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-primary" />
        Serveur de collecte des trames
      </Label>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Adresse IP / Domaine <span className="text-red-500">*</span></Label>
          <Input
            placeholder="ex: 192.168.1.100 ou traccar.myapp.com"
            value={form.server_ip}
            onChange={(e) => set("server_ip", e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Port</Label>
          <Input
            type="number"
            placeholder="5027"
            value={form.server_port}
            onChange={(e) => set("server_port", e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Protocole transport</Label>
          <div className="flex gap-2">
            {(["TCP", "UDP"] as const).map((p) => (
              <button
                key={p}
                onClick={() => set("protocol", p)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                  form.protocol === p
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Codec Teltonika</Label>
          <div className="flex gap-2">
            {(["Codec8", "Codec8E"] as const).map((c) => (
              <button
                key={c}
                onClick={() => set("codec", c)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                  form.codec === c
                    ? "bg-primary text-white border-primary"
                    : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {c === "Codec8" ? "Codec 8" : "Codec 8E"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* SMS command preview */}
    {form.apn && (
      <div className="bg-slate-900 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>Commande SMS équivalente (setparam)</span>
        </div>
        <code className="text-emerald-400 text-[11px] break-all">
          {`setparam 2001:${form.apn};2002:${form.apn_username || ""};2003:${form.apn_password || ""}`}
        </code>
        {form.server_ip && (
          <code className="block text-cyan-400 text-[11px] break-all">
            {`setparam 2004:${form.server_ip};2005:${form.server_port || "5027"}`}
          </code>
        )}
      </div>
    )}
  </div>
);

// ── Step 3: Association ────────────────────────────────────────────
const StepAssociation = ({
  form,
  set,
  equipmentList,
}: {
  form: FormData;
  set: (k: keyof FormData, v: any) => void;
  equipmentList: { id: string; name: string }[];
}) => (
  <div className="space-y-5">
    <div>
      <Label className="text-sm font-medium">Engin associé</Label>
      <p className="text-xs text-muted-foreground mb-2">Sélectionnez l'équipement sur lequel est installé ce tracker.</p>
      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
        <button
          onClick={() => set("equipment_id", "")}
          className={cn(
            "text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
            form.equipment_id === ""
              ? "bg-primary/5 border-primary text-primary"
              : "border-border text-muted-foreground hover:bg-muted/40"
          )}
        >
          Aucun (non associé)
        </button>
        {equipmentList.map((eq) => (
          <button
            key={eq.id}
            onClick={() => set("equipment_id", eq.id)}
            className={cn(
              "text-left px-3 py-2.5 rounded-lg border text-sm transition-all",
              form.equipment_id === eq.id
                ? "bg-primary/5 border-primary text-primary font-medium"
                : "border-border text-foreground hover:bg-muted/40"
            )}
          >
            {eq.name}
          </button>
        ))}
      </div>
    </div>

    <div className="border-t pt-4 space-y-4">
      <div>
        <Label className="text-sm font-medium flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Intervalle de transmission
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Fréquence d'envoi des trames GPS au serveur (en secondes). Recommandé : 30s.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={parseInt(form.ping_interval)}
            onChange={(e) => set("ping_interval", e.target.value)}
            className="flex-1 accent-primary h-1.5 rounded"
          />
          <div className="bg-muted px-3 py-1.5 rounded-lg min-w-[70px] text-center">
            <span className="text-sm font-bold text-foreground">{form.ping_interval}s</span>
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>5s (haute fréquence)</span>
          <span>300s (économie batterie)</span>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
        <div>
          <p className="text-sm font-medium">Mode veille (Sleep Mode)</p>
          <p className="text-xs text-muted-foreground">Réduit la consommation quand le véhicule est à l'arrêt.</p>
        </div>
        <Switch
          checked={form.sleep_mode}
          onCheckedChange={(v) => set("sleep_mode", v)}
        />
      </div>
    </div>
  </div>
);

// ── Step 4: Alerts ─────────────────────────────────────────────────
const StepAlerts = ({ form, set }: { form: FormData; set: (k: keyof FormData, v: any) => void }) => (
  <div className="space-y-5">
    {/* Speed */}
    <div>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Gauge className="w-4 h-4 text-amber-500" />
        Alerte survitesse
      </Label>
      <p className="text-xs text-muted-foreground mb-2">Une alerte sera déclenchée si la vitesse dépasse ce seuil.</p>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={20}
          max={200}
          step={5}
          value={parseInt(form.alert_speed_limit)}
          onChange={(e) => set("alert_speed_limit", e.target.value)}
          className="flex-1 accent-amber-500 h-1.5 rounded"
        />
        <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg min-w-[80px] text-center">
          <span className="text-sm font-bold text-amber-700">{form.alert_speed_limit} km/h</span>
        </div>
      </div>
    </div>

    {/* Ignition */}
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
      <div>
        <p className="text-sm font-medium">Alerte allumage moteur</p>
        <p className="text-xs text-muted-foreground">Notifie quand le contact clé est mis ou coupé.</p>
      </div>
      <Switch
        checked={form.alert_ignition}
        onCheckedChange={(v) => set("alert_ignition", v)}
      />
    </div>

    {/* Geofencing */}
    <div>
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 mb-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Géofencing (zone autorisée)
          </p>
          <p className="text-xs text-muted-foreground">Alerte si l'engin sort de la zone définie.</p>
        </div>
        <Switch
          checked={form.geofence_enabled}
          onCheckedChange={(v) => set("geofence_enabled", v)}
        />
      </div>

      {form.geofence_enabled && (
        <div className="border rounded-xl p-3 bg-muted/10">
          <p className="text-xs text-muted-foreground mb-3">
            Cliquez sur la carte pour définir le centre de la zone, puis ajustez le rayon.
          </p>
          <GeofenceMapPicker
            centerLat={form.geofence_lat}
            centerLng={form.geofence_lng}
            radiusKm={form.geofence_radius_km}
            onChange={(lat, lng, radius) => {
              set("geofence_lat", lat);
              set("geofence_lng", lng);
              set("geofence_radius_km", radius);
            }}
          />
        </div>
      )}
    </div>
  </div>
);

// ── Main Stepper ───────────────────────────────────────────────────
export const DeviceConfigStepper = ({
  equipmentList,
  editDevice,
  onSave,
  onCancel,
}: DeviceConfigStepperProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    ...defaultForm,
    ...(editDevice
      ? {
          imei: editDevice.imei || "",
          label: editDevice.label || "",
          bluetooth_pin: editDevice.bluetooth_pin || "5555",
          apn: editDevice.apn || "",
          server_ip: editDevice.server_ip || "",
          server_port: String(editDevice.server_port || 5027),
          equipment_id: editDevice.equipment_id || "",
          ping_interval: String(editDevice.ping_interval || 30),
          geofence_enabled: editDevice.geofence_enabled || false,
          geofence_lat: editDevice.last_lat || 6.8276,
          geofence_lng: editDevice.last_lng || -5.2893,
          geofence_radius_km: editDevice.geofence_radius_km || 5,
          alert_ignition: editDevice.alert_ignition ?? true,
          alert_speed_limit: String(editDevice.alert_speed_limit || 80),
        }
      : {}),
  });

  const set = (key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (currentStep === 0) {
      if (form.imei.length !== 15) { toast.error("L'IMEI doit comporter exactement 15 chiffres."); return false; }
      if (!form.label.trim()) { toast.error("Veuillez saisir un libellé pour le tracker."); return false; }
    }
    if (currentStep === 1) {
      if (!form.apn.trim()) { toast.error("L'APN est obligatoire."); return false; }
      if (!form.server_ip.trim()) { toast.error("L'adresse du serveur est obligatoire."); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="flex flex-col h-full">
      <StepIndicator currentStep={currentStep} />

      {/* Step content */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">{STEPS[currentStep].label}</h3>
          <p className="text-xs text-muted-foreground">{STEPS[currentStep].description}</p>
        </div>

        {currentStep === 0 && <StepIdentity form={form} set={set} />}
        {currentStep === 1 && <StepNetwork form={form} set={set} />}
        {currentStep === 2 && <StepAssociation form={form} set={set} equipmentList={equipmentList} />}
        {currentStep === 3 && <StepAlerts form={form} set={set} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-5 border-t mt-5">
        <Button variant="ghost" onClick={currentStep === 0 ? onCancel : prev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          {currentStep === 0 ? "Annuler" : "Précédent"}
        </Button>

        <span className="text-xs text-muted-foreground">
          Étape {currentStep + 1} / {STEPS.length}
        </span>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={next} className="gap-2">
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle2 className="w-4 h-4" />
            Enregistrer
          </Button>
        )}
      </div>
    </div>
  );
};

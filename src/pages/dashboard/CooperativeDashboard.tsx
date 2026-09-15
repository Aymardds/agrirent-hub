import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  ShoppingCart,
  CheckCircle2,
  Wheat,
  Plus,
  Send,
  Clock,
  Calendar,
  Loader2,
  ArrowRight,
  BarChart3,
  MapPin,
  Building2,
  AlertTriangle,
  Tractor,
  Sparkles,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  useCooperativeStats,
  useCooperativeOrders,
  useCooperativeMembers,
  useCreateCooperativeOrder,
  useSubmitOrderToAdmin,
  useEquipmentCatalog,
  EquipmentCatalogItem,
  CreateOrderPayload,
} from "@/hooks/useCooperativeOrders";
import { toast } from "sonner";

// ─── Helpers ───────────────────────────────────────────────────────────────

const PRESTATION_TYPES = [
  { value: "labourage", label: "🚜 Labourage" },
  { value: "moissonnage", label: "🌾 Moissonnage" },
  { value: "semis", label: "🌱 Semis" },
  { value: "recolte", label: "🍂 Récolte" },
  { value: "fertilisation", label: "🌿 Fertilisation" },
  { value: "desherbage", label: "🌾 Désherbage" },
  { value: "irrigation", label: "💧 Irrigation" },
  { value: "traitement", label: "🧴 Traitement phytosanitaire" },
];

const STATUS_CONFIG = {
  open: { label: "En cours", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
  quota_reached: { label: "Quota atteint ✅", className: "bg-green-500/10 text-green-600 border-green-200" },
  submitted: { label: "Transmis à Outiltech", className: "bg-orange-500/10 text-orange-600 border-orange-200" },
  confirmed: { label: "Confirmé", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Annulé", className: "bg-red-500/10 text-red-600 border-red-200" },
};

// ─── Modal de Création de Commande Groupée (Catalogue Outiltech) ──────────────

const CreateOrderModal = ({
  open,
  onClose,
  cooperativeId,
}: {
  open: boolean;
  onClose: () => void;
  cooperativeId: string;
}) => {
  const createOrder = useCreateCooperativeOrder();
  const { data: catalog = [], isLoading: catalogLoading } = useEquipmentCatalog();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number>(0);

  const [form, setForm] = useState<CreateOrderPayload & { deadline: string }>({
    title: "",
    description: "",
    prestation_type: "",
    quota_type: "area",
    quota_target: 0,
    equipment_type: "",
    equipment_id: "",
    service_id: "",
    price_per_ha: undefined,
    price_unit: "Hectare",
    deadline: "",
  });

  const selectedEquipment = catalog.find((e) => e.id === selectedEquipmentId);
  const availableServices = selectedEquipment?.equipment_services || [];
  const selectedService = availableServices.find((s) => s.id === selectedServiceId) || availableServices[0];
  const availablePrices = selectedService?.prices || [];

  // Quand l'utilisateur sélectionne un équipement du catalogue
  const handleEquipmentChange = (eqId: string) => {
    setSelectedEquipmentId(eqId);
    const equip = catalog.find((e) => e.id === eqId);
    if (!equip) return;

    const services = equip.equipment_services || [];
    let servName = equip.category || equip.service_type || "Prestation";
    let servId: string | undefined = undefined;
    let priceAmount = equip.price;
    let priceUnit = equip.price_unit || "Hectare";

    if (services.length > 0) {
      const firstServ = services[0];
      servId = firstServ.id;
      servName = firstServ.name;
      setSelectedServiceId(firstServ.id);

      if (firstServ.prices && firstServ.prices.length > 0) {
        priceAmount = firstServ.prices[0].amount;
        priceUnit = firstServ.prices[0].unit;
        setSelectedPriceIdx(0);
      }
    } else {
      setSelectedServiceId("");
      setSelectedPriceIdx(0);
    }

    const isArea = priceUnit.toLowerCase().includes("hectare") || priceUnit.toLowerCase().includes("casier");
    const quotaType = isArea ? "area" : "members";

    setForm((prev) => ({
      ...prev,
      equipment_id: equip.id,
      equipment_type: equip.name,
      service_id: servId,
      prestation_type: servName,
      price_per_ha: priceAmount,
      price_unit: priceUnit,
      quota_type: quotaType,
      title: `${servName} collectif — ${equip.name}`,
    }));
  };

  // Quand l'utilisateur sélectionne un service spécifique du matériel
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const serv = availableServices.find((s) => s.id === serviceId);
    if (!serv) return;

    let priceAmount = form.price_per_ha;
    let priceUnit = form.price_unit || "Hectare";

    if (serv.prices && serv.prices.length > 0) {
      priceAmount = serv.prices[0].amount;
      priceUnit = serv.prices[0].unit;
      setSelectedPriceIdx(0);
    }

    const isArea = priceUnit.toLowerCase().includes("hectare") || priceUnit.toLowerCase().includes("casier");

    setForm((prev) => ({
      ...prev,
      service_id: serv.id,
      prestation_type: serv.name,
      price_per_ha: priceAmount,
      price_unit: priceUnit,
      quota_type: isArea ? "area" : "members",
      title: `${serv.name} collectif — ${selectedEquipment?.name || ""}`,
    }));
  };

  // Quand l'utilisateur sélectionne une option tarifaire
  const handlePriceOptionChange = (idx: number) => {
    setSelectedPriceIdx(idx);
    const priceOpt = availablePrices[idx];
    if (!priceOpt) return;

    const isArea = priceOpt.unit.toLowerCase().includes("hectare") || priceOpt.unit.toLowerCase().includes("casier");

    setForm((prev) => ({
      ...prev,
      price_per_ha: priceOpt.amount,
      price_unit: priceOpt.unit,
      quota_type: isArea ? "area" : "members",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.prestation_type || form.quota_target <= 0) {
      toast.error("Veuillez remplir tous les champs obligatoires (matériel, prestation, quota cible).");
      return;
    }
    await createOrder.mutateAsync({
      cooperativeId,
      payload: {
        ...form,
        deadline: form.deadline || undefined,
        price_per_ha: form.price_per_ha || undefined,
        price_unit: form.price_unit || undefined,
        equipment_type: form.equipment_type || undefined,
        equipment_id: form.equipment_id || undefined,
        service_id: form.service_id || undefined,
        description: form.description || undefined,
      },
    });
    onClose();
    setSelectedEquipmentId("");
    setSelectedServiceId("");
    setForm({
      title: "",
      description: "",
      prestation_type: "",
      quota_type: "area",
      quota_target: 0,
      equipment_type: "",
      equipment_id: "",
      service_id: "",
      price_per_ha: undefined,
      price_unit: "Hectare",
      deadline: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Nouvelle Commande Groupée (Catalogue Outiltech)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Étape 1 : Choisir le Matériel dans le Catalogue */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border">
            <Label htmlFor="equipment-select" className="font-semibold flex items-center gap-1.5 text-sm">
              <Tractor className="w-4 h-4 text-primary" />
              1. Sélectionner le matériel dans le catalogue officiel *
            </Label>
            {catalogLoading ? (
              <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Chargement du catalogue Outiltech...
              </div>
            ) : (
              <Select
                value={selectedEquipmentId}
                onValueChange={handleEquipmentChange}
              >
                <SelectTrigger id="equipment-select" className="bg-background">
                  <SelectValue placeholder="Choisir un matériel (ex: Tracteur, Moissonneuse...)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {catalog.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — {item.category} ({item.location || "Disponible"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Aperçu compact du matériel sélectionné */}
            {selectedEquipment && (
              <div className="flex items-center gap-3 p-2.5 bg-background rounded-lg border border-primary/20 mt-2">
                {selectedEquipment.image_url ? (
                  <img
                    src={selectedEquipment.image_url}
                    alt={selectedEquipment.name}
                    className="w-14 h-14 object-cover rounded-md border shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Tractor className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedEquipment.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedEquipment.category} • {selectedEquipment.location}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    Catalogue vérifié
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Étape 2 : Service / Prestation & Tarif du Catalogue */}
          {selectedEquipment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 rounded-xl border border-border">
              {/* Prestation / Service */}
              <div>
                <Label className="text-xs font-semibold">2. Prestation du matériel *</Label>
                {availableServices.length > 0 ? (
                  <Select
                    value={selectedServiceId}
                    onValueChange={handleServiceChange}
                  >
                    <SelectTrigger className="bg-background mt-1 h-9">
                      <SelectValue placeholder="Choisir la prestation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.prestation_type}
                    onChange={(e) => setForm({ ...form, prestation_type: e.target.value })}
                    className="bg-background mt-1 h-9"
                    required
                  />
                )}
              </div>

              {/* Tarif & Unité issus du catalogue */}
              <div>
                <Label className="text-xs font-semibold">3. Tarif catalogue officiel *</Label>
                {availablePrices.length > 0 ? (
                  <Select
                    value={String(selectedPriceIdx)}
                    onValueChange={(val) => handlePriceOptionChange(Number(val))}
                  >
                    <SelectTrigger className="bg-background mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrices.map((p, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {new Intl.NumberFormat("fr-FR").format(p.amount)} FCFA / {p.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={form.price_per_ha || ""}
                      onChange={(e) => setForm({ ...form, price_per_ha: parseFloat(e.target.value) })}
                      placeholder="Prix unitaire"
                      className="bg-background h-9"
                    />
                    <span className="text-xs text-muted-foreground shrink-0 font-medium">
                      FCFA / {form.price_unit || "ha"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Titre de la campagne */}
          <div>
            <Label htmlFor="title">Titre de la commande groupée *</Label>
            <Input
              id="title"
              placeholder="ex: Labourage collectif Automne 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description & Consignes</Label>
            <Textarea
              id="description"
              placeholder="Détails de la campagne, conditions d'accès aux parcelles, ordre de passage..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Quota cible & Date limite */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quota_target">
                Quota cible * ({form.price_unit || (form.quota_type === "area" ? "ha" : "membres")})
              </Label>
              <Input
                id="quota_target"
                type="number"
                min="1"
                step={form.quota_type === "area" ? "0.5" : "1"}
                placeholder="ex: 80"
                value={form.quota_target || ""}
                onChange={(e) =>
                  setForm({ ...form, quota_target: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Objectif minimum pour valider la commande collective
              </p>
            </div>

            <div>
              <Label htmlFor="deadline">Date limite de ralliement</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Date maximale pour que les membres participent
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createOrder.isPending || !form.title || form.quota_target <= 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {createOrder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Créer la commande groupée
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Carte Commande ─────────────────────────────────────────────────────────

const OrderCard = ({
  order,
  cooperativeId,
}: {
  order: any;
  cooperativeId: string;
}) => {
  const submitOrder = useSubmitOrderToAdmin();
  const progressPct = Math.min(
    Math.round((order.current_progress / order.quota_target) * 100),
    100
  );
  const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
  const unit = order.price_unit ? ` ${order.price_unit}` : (order.quota_type === "area" ? " ha" : " membres");

  const handleSubmit = () => {
    submitOrder.mutate({ orderId: order.id, cooperativeId });
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
      {/* En-tête avec image éventuelle du matériel catalogue */}
      <div className="flex items-start gap-3 mb-3">
        {order.equipment?.image_url ? (
          <img
            src={order.equipment.image_url}
            alt={order.equipment.name}
            className="w-12 h-12 rounded-lg object-cover border shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Tractor className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{order.title}</h3>
            <Badge className={`text-xs border shrink-0 ${statusCfg.className}`}>
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">
            {order.prestation_type}
            {order.equipment?.name && ` • ${order.equipment.name}`}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-muted-foreground text-xs">Progression du quota</span>
          <span className="font-semibold text-xs">
            {order.current_progress}{unit} / {order.quota_target}{unit}
          </span>
        </div>
        <Progress
          value={progressPct}
          className="h-2.5"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[11px] text-muted-foreground">
            {order.quota_target - order.current_progress > 0
              ? `Reste ${(order.quota_target - order.current_progress).toFixed(1)}${unit}`
              : "Quota atteint ✅"}
          </span>
          <span className="text-xs font-bold text-foreground">{progressPct}%</span>
        </div>
      </div>

      {/* Infos secondaires avec tarif catalogue */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-1 border-t border-border/50">
        {order.price_per_ha ? (
          <span className="font-medium text-foreground">
            💰 {new Intl.NumberFormat("fr-FR").format(order.price_per_ha)} FCFA / {order.price_unit || "ha"}
          </span>
        ) : (
          <span />
        )}
        {order.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Limite : {new Date(order.deadline).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link to={`/dashboard/cooperative/orders/${order.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Détails & Participants
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
        {order.status === "quota_reached" && (
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSubmit}
            disabled={submitOrder.isPending}
          >
            {submitOrder.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1" />
            )}
            Soumettre à Outiltech
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Page Principale ────────────────────────────────────────────────────────

const CooperativeDashboard = () => {
  const { user, profile } = useAuth();
  const cooperativeId = user?.id;

  const { data: stats, isLoading: statsLoading } = useCooperativeStats(cooperativeId);
  const { data: orders, isLoading: ordersLoading } = useCooperativeOrders(cooperativeId);
  const { data: members, isLoading: membersLoading } = useCooperativeMembers(cooperativeId);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const cooperativeName =
    profile?.company || user?.user_metadata?.full_name || "Ma Coopérative";

  const activeOrders = orders?.filter((o) =>
    ["open", "quota_reached"].includes(o.status)
  ) || [];

  const submittedOrders = orders?.filter((o) =>
    ["submitted", "confirmed"].includes(o.status)
  ) || [];

  if (statsLoading || ordersLoading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du tableau de bord...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── En-tête ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {cooperativeName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tableau de bord Coopérative
                </p>
              </div>
            </div>
          </div>
          <Button
            id="create-order-btn"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle commande groupée
          </Button>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats?.membersCount || 0}</p>
            <p className="text-sm text-muted-foreground">Membres actifs</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats?.openOrders || 0}</p>
            <p className="text-sm text-muted-foreground">Commandes ouvertes</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats?.quotaReached || 0}</p>
            <p className="text-sm text-muted-foreground">Quotas atteints</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Wheat className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {stats?.totalEngagedArea?.toFixed(1) || "0"} ha
            </p>
            <p className="text-sm text-muted-foreground">Superficie engagée</p>
          </Card>
        </div>

        {/* ── Commandes actives ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Commandes groupées en cours
            </h2>
            <Link to="/dashboard/cooperative/orders">
              <Button variant="ghost" size="sm">
                Voir toutes <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <Card className="p-10 text-center border-dashed">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground mb-4">
                Aucune commande groupée en cours.
              </p>
              <Button onClick={() => setCreateModalOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer une première commande
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  cooperativeId={cooperativeId!}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Section inférieure : membres + commandes transmises ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Membres récents */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Membres de la coopérative
              </h3>
              <Link to="/dashboard/cooperative/members">
                <Button variant="ghost" size="sm">
                  Voir tous <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {membersLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-3">
                {members.slice(0, 5).map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {(member.full_name || "?")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.full_name || "Sans nom"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.phone || "Aucun téléphone"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Client
                    </Badge>
                  </div>
                ))}
                {members.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    + {members.length - 5} autres membres
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun membre lié à cette coopérative.</p>
                <p className="text-xs mt-1 mb-3">
                  Vous pouvez inscrire vos agriculteurs ou rattacher des clients existants.
                </p>
                <Link to="/dashboard/cooperative/members">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Gérer & Ajouter des membres
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Commandes soumises / historique */}
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-primary" />
              Commandes transmises à Outiltech
            </h3>

            {submittedOrders.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune commande soumise pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submittedOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{order.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.submitted_at
                            ? `Soumis le ${new Date(order.submitted_at).toLocaleDateString("fr-FR")}`
                            : "Quota atteint"}
                        </p>
                      </div>
                      <Badge className={`text-xs border ml-2 shrink-0 ${cfg?.className}`}>
                        {cfg?.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Modal création ── */}
      {cooperativeId && (
        <CreateOrderModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          cooperativeId={cooperativeId}
        />
      )}
    </DashboardLayout>
  );
};

export default CooperativeDashboard;

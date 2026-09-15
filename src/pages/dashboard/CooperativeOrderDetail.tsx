import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  Send,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Wheat,
  Info,
  Tractor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCooperativeOrderDetails,
  useSubmitOrderToAdmin,
} from "@/hooks/useCooperativeOrders";

const STATUS_CONFIG = {
  open: { label: "En cours de collecte", className: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Clock },
  quota_reached: { label: "Quota atteint ✅", className: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2 },
  submitted: { label: "Transmis à Outiltech", className: "bg-orange-500/10 text-orange-600 border-orange-200", icon: Send },
  confirmed: { label: "Confirmé par Outiltech", className: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Annulé", className: "bg-red-500/10 text-red-600 border-red-200", icon: XCircle },
};

const PARTICIPATION_STATUS = {
  pending: { label: "En attente", className: "bg-yellow-500/10 text-yellow-600" },
  confirmed: { label: "Confirmé", className: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Annulé", className: "bg-red-500/10 text-red-600" },
};

const CooperativeOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const cooperativeId = user?.id;

  const { data: order, isLoading } = useCooperativeOrderDetails(orderId);
  const submitOrder = useSubmitOrderToAdmin();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Commande introuvable.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const unit = order.price_unit ? ` ${order.price_unit}` : (order.quota_type === "area" ? " ha" : " membres");
  const progressPct = Math.min(
    Math.round((order.current_progress / order.quota_target) * 100),
    100
  );
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;

  const totalEngaged = order.participations
    .filter((p) => p.status !== "cancelled")
    .reduce((s, p) => s + p.committed_area, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">

        {/* En-tête */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{order.title}</h1>
            <p className="text-sm text-muted-foreground capitalize">{order.prestation_type}</p>
          </div>
          <Badge className={`border ${statusCfg.className} flex items-center gap-1.5`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusCfg.label}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Infos principales */}
          <div className="lg:col-span-2 space-y-5">

            {/* Barre de progression */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-primary" />
                Avancement du quota
              </h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-bold text-foreground">
                  {order.current_progress.toFixed(1)}{unit} / {order.quota_target}{unit}
                </span>
              </div>
              <Progress value={progressPct} className="h-4 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{order.participants_count} participant(s)</span>
                <span className="font-semibold text-foreground">{progressPct}%</span>
              </div>

              {order.status === "quota_reached" && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      Quota atteint ! La commande peut être soumise à Outiltech.
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Cliquez sur "Soumettre à Outiltech" pour transmettre la commande groupée.
                    </p>
                  </div>
                </div>
              )}

              {order.status === "submitted" && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700">
                      Commande transmise à l'équipe Outiltech le{" "}
                      {order.submitted_at
                        ? new Date(order.submitted_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      En attente de confirmation par l'administrateur Outiltech.
                    </p>
                  </div>
                </div>
              )}

              {order.status === "confirmed" && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Commande confirmée par Outiltech !
                    </p>
                    {order.admin_notes && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Note Outiltech : {order.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Liste des participants */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Participations ({order.participants_count})
              </h2>

              {order.participations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune participation enregistrée pour l'instant.</p>
                  <p className="text-xs mt-1">
                    Les membres recevront l'annonce et pourront confirmer leur part.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
                    <span>Membre</span>
                    <span className="text-right">Superficie engagée</span>
                    <span className="text-right">Statut</span>
                  </div>
                  {order.participations.map((p) => {
                    const partStatus = PARTICIPATION_STATUS[p.status as keyof typeof PARTICIPATION_STATUS];
                    return (
                      <div
                        key={p.id}
                        className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {p.member?.full_name || "Membre inconnu"}
                          </p>
                          {p.property && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {p.property.name} ({p.property.size} ha)
                            </p>
                          )}
                          {p.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-sm text-right">
                          {p.committed_area}{unit}
                        </span>
                        <Badge className={`text-xs ${partStatus?.className} shrink-0`}>
                          {partStatus?.label}
                        </Badge>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-3 py-3 rounded-lg bg-muted/50 border-t border-border mt-2">
                    <span className="font-semibold text-sm">Total engagé</span>
                    <span className="font-bold text-primary text-right">
                      {totalEngaged.toFixed(1)}{unit}
                    </span>
                    <span />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-4">

            {/* Matériel du Catalogue Outiltech */}
            {order.equipment && (
              <Card className="p-4 border-primary/20 bg-primary/5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5" />
                  Matériel du Catalogue Outiltech
                </p>
                <div className="flex items-center gap-3">
                  {order.equipment.image_url ? (
                    <img
                      src={order.equipment.image_url}
                      alt={order.equipment.name}
                      className="w-14 h-14 object-cover rounded-lg border border-primary/20 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Tractor className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{order.equipment.name}</p>
                    <p className="text-xs text-muted-foreground">{order.equipment.category} • {order.equipment.location || "Flotte locale"}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 bg-background text-emerald-700 border-emerald-300">
                      Flotte Outiltech
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {/* Détails */}
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Détails de la commande</h3>
              <div className="space-y-3 text-sm">
                {order.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground">{order.description}</p>
                  </div>
                )}
                {order.equipment_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matériel assigné</span>
                    <span className="font-medium">{order.equipment_type}</span>
                  </div>
                )}
                {order.price_per_ha && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix/{order.quota_type === "area" ? "ha" : "membre"}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("fr-FR").format(order.price_per_ha)} FCFA
                    </span>
                  </div>
                )}
                {order.price_per_ha && order.current_progress > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant estimé</span>
                    <span className="font-semibold text-primary">
                      {new Intl.NumberFormat("fr-FR").format(
                        order.price_per_ha * order.current_progress
                      )}{" "}
                      FCFA
                    </span>
                  </div>
                )}
                {order.deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date limite</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.deadline).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créée le</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </Card>

            {/* Action principale */}
            {order.status === "quota_reached" && cooperativeId && (
              <Button
                id="submit-to-outiltech-btn"
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() =>
                  submitOrder.mutate({
                    orderId: order.id,
                    cooperativeId,
                  })
                }
                disabled={submitOrder.isPending}
              >
                {submitOrder.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Soumettre à Outiltech
              </Button>
            )}

            <Link to="/dashboard">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CooperativeOrderDetail;

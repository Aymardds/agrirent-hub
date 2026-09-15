import { useState } from "react";
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
  Calendar,
  CheckCircle2,
  Clock,
  Wheat,
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  CooperativeOrder,
  useMyParticipation,
  useJoinCooperativeOrder,
  useCancelParticipation,
} from "@/hooks/useCooperativeOrders";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  order: CooperativeOrder;
  memberId: string;
}

// ─── Hook propriétés du membre ───────────────────────────────────────────────

const useMemberProperties = (memberId: string) => {
  return useQuery({
    queryKey: ["member-properties", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, size, unit")
        .eq("owner_id", memberId);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// ─── Modal de participation ──────────────────────────────────────────────────

const ParticipationModal = ({
  open,
  onClose,
  order,
  memberId,
  existingParticipation,
}: {
  open: boolean;
  onClose: () => void;
  order: CooperativeOrder;
  memberId: string;
  existingParticipation: any | null;
}) => {
  const joinOrder = useJoinCooperativeOrder();
  const { data: properties = [] } = useMemberProperties(memberId);

  const [committedArea, setCommittedArea] = useState<number>(
    existingParticipation?.committed_area || 0
  );
  const [propertyId, setPropertyId] = useState<string>(
    existingParticipation?.property_id || ""
  );
  const [notes, setNotes] = useState<string>(existingParticipation?.notes || "");

  const unit = order.price_unit ? ` ${order.price_unit}` : (order.quota_type === "area" ? " ha" : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (committedArea <= 0) return;

    await joinOrder.mutateAsync({
      memberId,
      payload: {
        order_id: order.id,
        committed_area: committedArea,
        property_id: propertyId || undefined,
        notes: notes || undefined,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="w-5 h-5 text-primary" />
            {existingParticipation ? "Modifier ma participation" : "Confirmer ma participation"}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium">{order.title}</p>
          <p className="text-muted-foreground text-xs mt-1 capitalize">
            {order.prestation_type}
            {order.equipment?.name && ` • ${order.equipment.name}`}
          </p>
          {order.price_per_ha && (
            <p className="text-xs text-primary font-medium mt-1">
              Tarif catalogue : {new Intl.NumberFormat("fr-FR").format(order.price_per_ha)} FCFA / {order.price_unit || "ha"}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="committed_area">
              {order.price_unit
                ? `Quantité à traiter (${order.price_unit}) *`
                : order.quota_type === "area"
                ? "Superficie à traiter (ha) *"
                : "Nombre de membres confirmés *"}
            </Label>
            <Input
              id="committed_area"
              type="number"
              min="0.1"
              step={order.quota_type === "area" ? "0.5" : "1"}
              value={committedArea || ""}
              onChange={(e) => setCommittedArea(parseFloat(e.target.value) || 0)}
              placeholder="ex: 5"
              required
            />
            {order.price_per_ha && committedArea > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                💰 Estimation :{" "}
                <span className="font-semibold">
                  {new Intl.NumberFormat("fr-FR").format(
                    order.price_per_ha * committedArea
                  )}{" "}
                  FCFA
                </span>
              </p>
            )}
          </div>

          {properties.length > 0 && order.quota_type === "area" && (
            <div>
              <Label>Parcelle concernée (optionnel)</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une parcelle..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune parcelle spécifique</SelectItem>
                  {properties.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.size} {p.unit || "ha"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Commentaire (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Précisions sur votre participation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={joinOrder.isPending || committedArea <= 0}>
              {joinOrder.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {existingParticipation ? "Mettre à jour" : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Composant Principal ─────────────────────────────────────────────────────

const CooperativeAnnouncementCard = ({ order, memberId }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: myParticipation, isLoading: partLoading } = useMyParticipation(
    order.id,
    memberId
  );
  const cancelParticipation = useCancelParticipation();

  const unit = order.price_unit ? ` ${order.price_unit}` : (order.quota_type === "area" ? " ha" : " membres");
  const progressPct = Math.min(
    Math.round((order.current_progress / order.quota_target) * 100),
    100
  );

  const hasParticipated =
    myParticipation && myParticipation.status !== "cancelled";

  const daysLeft = order.deadline
    ? Math.ceil(
        (new Date(order.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const handleCancel = () => {
    if (myParticipation) {
      cancelParticipation.mutate({
        participationId: myParticipation.id,
        orderId: order.id,
        memberId,
      });
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">

      {/* Bannière */}
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/15 border-b border-primary/20">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          📢 Annonce Coopérative • Service Catalogue Outiltech
        </span>
        {order.status === "quota_reached" && (
          <Badge className="ml-auto text-xs bg-green-500/10 text-green-600 border-green-200">
            Quota atteint !
          </Badge>
        )}
      </div>

      <div className="p-4">
        {/* Titre, matériel catalogue et compte à rebours */}
        <div className="flex items-start gap-3 mb-3">
          {order.equipment?.image_url ? (
            <img
              src={order.equipment.image_url}
              alt={order.equipment.name}
              className="w-14 h-14 rounded-lg object-cover border border-primary/20 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-foreground truncate">{order.title}</h3>
              {daysLeft !== null && (
                <div
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    daysLeft <= 7
                      ? "bg-red-100 text-red-600"
                      : daysLeft <= 14
                      ? "bg-orange-100 text-orange-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Clock className="w-3 h-3 inline mr-1" />
                  {daysLeft > 0 ? `J-${daysLeft}` : "Expiré"}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              <span className="font-medium text-foreground">{order.prestation_type}</span>
              {order.equipment?.name && ` • ${order.equipment.name}`}
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground text-xs">Avancement collectif du quota</span>
            <span className="font-semibold text-sm">
              {order.current_progress.toFixed(1)}{unit} / {order.quota_target}{unit}
            </span>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Participation collective
            </span>
            <span className="font-medium">{progressPct}%</span>
          </div>
        </div>

        {/* Info tarif catalogue */}
        {order.price_per_ha && (
          <p className="text-xs text-muted-foreground mb-3 bg-muted/40 p-2 rounded-md">
            💰 Tarif officiel du catalogue :{" "}
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat("fr-FR").format(order.price_per_ha)} FCFA / {order.price_unit || "ha"}
            </span>
          </p>
        )}

        {/* Statut de ma participation */}
        {partLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : hasParticipated ? (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Ma participation : {myParticipation?.committed_area}{unit}
                  </p>
                  <p className="text-xs text-green-600">
                    Enregistrée le{" "}
                    {new Date(myParticipation!.joined_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-600 text-xs">
                {myParticipation?.status === "confirmed" ? "Confirmé" : "En attente"}
              </Badge>
            </div>
          </div>
        ) : null}

        {/* Description (expansible) */}
        {order.description && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Masquer les détails" : "Voir les détails"}
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {order.description}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!hasParticipated ? (
            <Button
              id={`join-order-${order.id}`}
              className="flex-1"
              onClick={() => setModalOpen(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmer ma participation
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setModalOpen(true)}
              >
                Modifier ma participation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleCancel}
                disabled={cancelParticipation.isPending}
              >
                {cancelParticipation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span className="ml-1 hidden sm:inline">Annuler</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal participation */}
      <ParticipationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        order={order}
        memberId={memberId}
        existingParticipation={hasParticipated ? myParticipation : null}
      />
    </div>
  );
};

export default CooperativeAnnouncementCard;

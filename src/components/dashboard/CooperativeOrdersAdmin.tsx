import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  CheckCircle2,
  Clock,
  Users,
  Wheat,
  Send,
  Loader2,
  ArrowRight,
  Phone,
  Calendar,
  Tractor,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAdminSubmittedOrders,
  useConfirmCooperativeOrder,
} from "@/hooks/useCooperativeOrders";

// ─── Modal de confirmation admin ─────────────────────────────────────────────

const ConfirmOrderModal = ({
  open,
  onClose,
  orderId,
  orderTitle,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderTitle: string;
}) => {
  const confirm = useConfirmCooperativeOrder();
  const [adminNotes, setAdminNotes] = useState("");

  const handleConfirm = async () => {
    await confirm.mutateAsync({ orderId, adminNotes });
    onClose();
    setAdminNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Confirmer la commande groupée
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm">{orderTitle}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">
              Note pour la coopérative (optionnel)
            </label>
            <Textarea
              placeholder="Informations complémentaires, planification, etc."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={handleConfirm}
            disabled={confirm.isPending}
          >
            {confirm.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Widget Principal ────────────────────────────────────────────────────────

const CooperativeOrdersAdmin = () => {
  const { data: orders, isLoading } = useAdminSubmittedOrders();
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    orderId: string;
    title: string;
  }>({ open: false, orderId: "", title: "" });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return null; // Pas de commandes → ne pas afficher le widget
  }

  return (
    <>
      <Card className="p-6 border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            Commandes coopératives reçues
            <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 text-xs ml-1">
              {orders.length} en attente
            </Badge>
          </h3>
        </div>

        <div className="space-y-3">
          {orders.map((order: any) => {
            const coop = order.cooperative || {};
            const unit = order.price_unit ? ` ${order.price_unit}` : (order.quota_type === "area" ? " ha" : " membres");
            const isSubmitted = order.status === "submitted";

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border ${
                  isSubmitted
                    ? "border-orange-200 bg-orange-50/50 dark:bg-orange-950/10"
                    : "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs border ${
                          isSubmitted
                            ? "bg-orange-500/10 text-orange-600 border-orange-200"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                        }`}
                      >
                        {isSubmitted ? (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Soumis
                          </>
                        ) : (
                          <>
                            <Wheat className="w-3 h-3 mr-1" />
                            Quota atteint
                          </>
                        )}
                      </Badge>
                    </div>

                    <p className="font-semibold text-sm truncate">{order.title}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {order.equipment?.name && (
                        <span className="flex items-center gap-1 font-medium text-foreground bg-primary/10 px-2 py-0.5 rounded">
                          <Tractor className="w-3.5 h-3.5 text-primary" />
                          {order.equipment.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {coop.company || coop.full_name || "Coopérative"}
                      </span>
                      {coop.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {coop.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Wheat className="w-3.5 h-3.5" />
                        {order.current_progress?.toFixed(1)}{unit} engagés
                      </span>
                      {order.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>

                    {order.submitted_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reçu le{" "}
                        {new Date(order.submitted_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  <Button
                    id={`confirm-order-${order.id}`}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
                    onClick={() =>
                      setConfirmModal({
                        open: true,
                        orderId: order.id,
                        title: order.title,
                      })
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal */}
      <ConfirmOrderModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, orderId: "", title: "" })}
        orderId={confirmModal.orderId}
        orderTitle={confirmModal.title}
      />
    </>
  );
};

export default CooperativeOrdersAdmin;

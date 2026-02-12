import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingDown, Calendar, Home, ChevronRight } from "lucide-react";
import { useCreditsByProperty, useCreditStats } from "@/hooks/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CreditSummaryCard = () => {
    const { user } = useAuth();
    const { data: creditStats, isLoading: statsLoading } = useCreditStats(user?.id);
    const { data: creditsByProperty, isLoading: propertyLoading } = useCreditsByProperty(user?.id);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (statsLoading || propertyLoading) {
        return (
            <Card className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
            </Card>
        );
    }

    if (!creditStats || creditStats.totalCredits === 0) {
        return null; // Don't show if no credits
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const handlePropertyClick = (property: any) => {
        setSelectedProperty(property);
        setIsDialogOpen(true);
    };

    return (
        <>
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">Crédits à payer à la récolte</h3>
                                <p className="text-2xl font-bold text-orange-700">{formatCurrency(creditStats.totalRemaining)}</p>
                            </div>
                        </div>
                        {creditStats.overdueCredits > 0 && (
                            <Badge variant="destructive">
                                {creditStats.overdueCredits} en retard
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-orange-200">
                        <div>
                            <p className="text-xs text-muted-foreground">Total emprunté</p>
                            <p className="font-semibold text-sm">{formatCurrency(creditStats.totalCredits)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Déjà payé</p>
                            <p className="font-semibold text-sm text-green-600">{formatCurrency(creditStats.totalPaid)}</p>
                        </div>
                    </div>

                    {creditsByProperty && creditsByProperty.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-orange-200">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Crédits par propriété</p>
                            {creditsByProperty.map((property) => (
                                <button
                                    key={property.property_id}
                                    onClick={() => handlePropertyClick(property)}
                                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg hover:shadow-sm transition-all border border-orange-100"
                                >
                                    <div className="flex items-center gap-2">
                                        <Home className="w-4 h-4 text-orange-600" />
                                        <div className="text-left">
                                            <p className="font-medium text-sm">{property.property_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {property.credits.length} crédit{property.credits.length > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-orange-700">
                                                {formatCurrency(property.total_remaining)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                sur {formatCurrency(property.total_credits)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Property Credits Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            {selectedProperty?.property_name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedProperty && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="font-bold">{formatCurrency(selectedProperty.total_credits)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Payé</p>
                                    <p className="font-bold text-green-600">{formatCurrency(selectedProperty.total_paid)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Restant</p>
                                    <p className="font-bold text-orange-600">{formatCurrency(selectedProperty.total_remaining)}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Détails des crédits</h4>
                                {selectedProperty.credits.map((credit: any) => (
                                    <div key={credit.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{credit.rental?.equipment?.name || 'Prestation'}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Créé le {format(new Date(credit.created_at), 'PPP', { locale: fr })}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                credit.status === 'paid' ? 'default' :
                                                    credit.status === 'overdue' ? 'destructive' : 'secondary'
                                            }>
                                                {credit.status === 'paid' ? 'Payé' :
                                                    credit.status === 'overdue' ? 'En retard' :
                                                        credit.status === 'active' ? 'Actif' : 'Annulé'}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs">Montant total</p>
                                                <p className="font-semibold">{formatCurrency(credit.total_amount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs">Restant</p>
                                                <p className="font-semibold text-orange-600">{formatCurrency(credit.amount_remaining)}</p>
                                            </div>
                                        </div>

                                        {credit.due_date && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">Échéance:</span>
                                                <span className="font-medium">
                                                    {format(new Date(credit.due_date), 'PPP', { locale: fr })}
                                                </span>
                                            </div>
                                        )}

                                        {credit.installments > 1 && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Paiement en </span>
                                                <span className="font-medium">{credit.installments} échéances</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CreditSummaryCard;

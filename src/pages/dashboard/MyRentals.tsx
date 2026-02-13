
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRentals, Rental } from "@/hooks/useRentals";
import { toast } from "sonner";
import { Calendar, CheckCircle2, XCircle, Clock, FileText, CreditCard, Wallet, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import RentalCalendar from "@/components/dashboard/RentalCalendar";
import InvoiceDialog from "@/components/dashboard/InvoiceDialog";
import PaymentDialog from "@/components/dashboard/PaymentDialog";
import { Badge } from "@/components/ui/badge";



import { useSearchParams } from "react-router-dom";

// ... existing imports

const MyRentals = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter');
    const [activeTab, setActiveTab] = useState("tenant"); // tenant, owner, planning

    // Use the custom hook for data fetching and mutations
    const {
        rentals,
        isLoading: loading,
        updateStatus,
        updatePaymentStatus,
        refetch
    } = useRentals({
        userId: user?.id,
        activeTab,
        filter
    });

    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Manual update wrappers to match previous signature (if needed) or use directly
    const handleUpdateStatus = (rentalId: string, newStatus: string) => {
        updateStatus({ id: rentalId, status: newStatus });
    };

    const handleUpdatePaymentStatus = (rentalId: string, newStatus: string) => {
        updatePaymentStatus({ id: rentalId, status: newStatus });
    };

    const handleViewInvoice = (rental: Rental) => {
        setSelectedRental(rental);
        setIsInvoiceOpen(true);
    };

    const handlePay = (rental: Rental) => {
        setSelectedRental(rental);
        setIsPaymentOpen(true);
    };

    const onPaymentSuccess = () => {
        refetch();
        // Dialog will close via user interaction or we can close it here if needed, 
        // but the component handles its 'Success' state.
        // If we want to auto-close after success we could set timeout, but user might want to see confirmation.
    };

    const statusColors = {
        pending: "bg-warning/10 text-warning",
        active: "bg-blue-500/10 text-blue-500",
        completed: "bg-success/10 text-success",
        cancelled: "bg-destructive/10 text-destructive",
    };

    const paymentColors = {
        pending: "bg-yellow-500/10 text-yellow-500",
        paid: "bg-green-500/10 text-green-500",
        failed: "bg-red-500/10 text-red-500",
    };

    const statusLabels = {
        pending: "En attente",
        active: "En cours",
        completed: "Terminée",
        cancelled: "Annulée",
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Gestion des Prestations</h1>
                        <p className="text-muted-foreground">Suivez vos prestations, paiements et planning</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="tenant">Prestations</TabsTrigger>
                        <TabsTrigger value="owner">Mission exécutée par</TabsTrigger>
                        <TabsTrigger value="planning">Planning</TabsTrigger>
                    </TabsList>

                    <TabsContent value="planning" className="mt-6">
                        <RentalCalendar rentals={rentals} />
                    </TabsContent>

                    <TabsContent value={activeTab} className="mt-6">
                        {activeTab !== "planning" && (
                            loading ? (
                                <div className="text-center py-12">Chargement...</div>
                            ) : rentals.length === 0 ? (
                                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium">Aucune prestation trouvée</h3>
                                    <p className="text-muted-foreground">Aucune donnée à afficher pour le moment.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {rentals.map((rental) => (
                                        <div key={rental.id} className="bg-card border border-border rounded-xl p-6 flex flex-col items-start gap-4 hover:shadow-sm transition-all shadow-sm">
                                            {/* Header Section */}
                                            <div className="w-full flex flex-col md:flex-row justify-between gap-4 items-start">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                                        🚜
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-foreground mb-1">
                                                            {rental.prestation_type ? `Service: ${rental.prestation_type}` : rental.equipment.name}
                                                        </h3>
                                                        <div className="flex flex-col text-sm text-muted-foreground gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>{rental.start_date} - {rental.end_date}</span>
                                                            </div>
                                                            {rental.properties && (
                                                                <div className="flex items-center gap-2 font-medium text-primary">
                                                                    <Home className="w-4 h-4" />
                                                                    <span>Propriété: {rental.properties.name}</span>
                                                                </div>
                                                            )}
                                                            {activeTab === "owner" && rental.interventions && rental.interventions.length > 0 && (
                                                                <div className="flex flex-col gap-3 mt-3 w-full">
                                                                    {rental.interventions.map((intervention: any, idx: number) => (
                                                                        <div key={idx} className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm">
                                                                            <div className="font-semibold text-primary mb-1">
                                                                                Mission exécutée par: {intervention.technician?.full_name || "Non assigné"}
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Calendar className="w-3 h-3" />
                                                                                    <span>{new Date(intervention.created_at).toLocaleDateString()}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <MapPin className="w-3 h-3" />
                                                                                    <span>{rental.properties?.name || "Propriété inconnue"}</span>
                                                                                </div>
                                                                                {intervention.area_covered && (
                                                                                    <div className="col-span-2 font-medium text-foreground flex items-center gap-1 mt-1">
                                                                                        <CheckCircle2 className="w-3 h-3 text-success" />
                                                                                        <span>
                                                                                            Superficie: {intervention.area_covered} {rental.properties?.unit === 'casiers' ? 'casiers' : 'ha'}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {activeTab === "owner" && rental.renter && (
                                                                <span className="text-muted-foreground text-xs mt-1">
                                                                    Client: {rental.renter.full_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex gap-2">
                                                        <Badge variant="secondary" className={statusColors[rental.status]}>
                                                            {statusLabels[rental.status]}
                                                        </Badge>
                                                        <Badge variant="outline" className={`${paymentColors[rental.payment_status] || paymentColors.pending} border-0`}>
                                                            {rental.payment_status === 'paid' ? 'Payé' : 'Non payé'}
                                                        </Badge>
                                                    </div>
                                                    <span className="font-bold text-lg">{rental.total_price.toLocaleString()} FCFA</span>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-border my-2" />

                                            {/* Actions Section */}
                                            <div className="w-full flex flex-wrap justify-end gap-3">
                                                {/* Invoice Action */}
                                                <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(rental)}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Facture
                                                </Button>

                                                {/* Tenant Actions: Pay */}
                                                {activeTab === "tenant" && (rental.status === "active" || rental.status === "pending") && rental.payment_status !== "paid" && (
                                                    <Button size="sm" variant="hero" onClick={() => handlePay(rental)}>
                                                        <Wallet className="w-4 h-4 mr-2" />
                                                        Payer maintenant
                                                    </Button>
                                                )}

                                                {/* Owner Actions */}
                                                {activeTab === "owner" && (
                                                    <>
                                                        {rental.payment_status !== 'paid' && (
                                                            <Button size="sm" variant="outline" onClick={() => handleUpdatePaymentStatus(rental.id, 'paid')}>
                                                                <CreditCard className="w-4 h-4 mr-2" />
                                                                Marquer Payé
                                                            </Button>
                                                        )}

                                                        {rental.status === "pending" && (
                                                            <>
                                                                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleUpdateStatus(rental.id, 'cancelled')}>
                                                                    Refuser
                                                                </Button>
                                                                <Button size="sm" variant="hero" onClick={() => handleUpdateStatus(rental.id, 'active')}>
                                                                    Accepter
                                                                </Button>
                                                            </>
                                                        )}
                                                        {rental.status === "active" && (
                                                            <Button size="sm" variant="default" onClick={() => handleUpdateStatus(rental.id, 'completed')}>
                                                                Terminer Prestation
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <InvoiceDialog
                open={isInvoiceOpen}
                onOpenChange={setIsInvoiceOpen}
                rental={selectedRental}
            />

            <PaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                rental={selectedRental}
                onPaymentSuccess={onPaymentSuccess}
            />
        </DashboardLayout>
    );
};

export default MyRentals;

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, AlertTriangle, MoreVertical, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import InvoiceDialog from "@/components/dashboard/InvoiceDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Rental {
    id: string;
    created_at: string;
    total_price: number;
    payment_status: "pending" | "paid" | "failed";
    status: string;
    invoice_number: string;
    renter: { full_name: string };
    equipment: { name: string };
}

const Accounting = () => {
    const { user, profile } = useAuth();
    const [transactions, setTransactions] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;

            let query = supabase
                .from("rentals")
                .select(`
                    *,
                    renter:renter_id (full_name),
                    equipment!inner (name, owner_id)
                `);

            // If not super_admin or accountant, strictly filter revenue by Owned Equipment
            if (profile?.role !== 'super_admin' && profile?.role !== 'accountant') {
                query = query.eq('equipment.owner_id', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (!error && data) {
                setTransactions(data as any);
            }
            setLoading(false);
        };
        fetchTransactions();
    }, [user]);

    const totalRevenue = transactions
        .filter(t => t.payment_status === 'paid')
        .reduce((sum, t) => sum + t.total_price, 0);

    const pendingRevenue = transactions
        .filter(t => t.payment_status === 'pending')
        .reduce((sum, t) => sum + t.total_price, 0);

    const updatePaymentStatus = async (rentalId: string, newStatus: 'paid' | 'pending') => {
        try {
            const { error } = await supabase
                .from('rentals')
                .update({ payment_status: newStatus })
                .eq('id', rentalId);

            if (error) throw error;

            toast.success(`Statut mis à jour : ${newStatus === 'paid' ? 'Payé' : 'En attente'}`);

            // Update local state
            setTransactions(transactions.map(t =>
                t.id === rentalId ? { ...t, payment_status: newStatus } : t
            ));
        } catch (error: any) {
            toast.error("Erreur de mise à jour: " + error.message);
        }
    };

    const handleViewInvoice = (rental: Rental) => {
        setSelectedRental(rental);
        setIsInvoiceOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold font-display">Comptabilité & Finances</h1>
                    <p className="text-muted-foreground">Suivi des factures et des paiements</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-success/10 rounded-lg text-success">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <Badge variant="outline" className="border-success/20 text-success">Encaissé</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Revenu Total</p>
                        <h3 className="text-3xl font-bold mt-1">{totalRevenue.toLocaleString()} FCFA</h3>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-warning/10 rounded-lg text-warning">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <Badge variant="outline" className="border-warning/20 text-warning">En attente</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Paiements en attente</p>
                        <h3 className="text-3xl font-bold mt-1">{pendingRevenue.toLocaleString()} FCFA</h3>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <FileText className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                        <h3 className="text-3xl font-bold mt-1">{transactions.length}</h3>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-semibold text-lg">Historique des Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                                <tr>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Client</th>
                                    <th className="px-6 py-4 text-left">Service/Matériel</th>
                                    <th className="px-6 py-4 text-left">Montant</th>
                                    <th className="px-6 py-4 text-left">Statut</th>
                                    <th className="px-6 py-4 text-right">Facture</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{t.renter?.full_name || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{t.equipment?.name}</td>
                                        <td className="px-6 py-4 font-bold">{t.total_price.toLocaleString()} FCFA</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                t.payment_status === 'paid' ? "bg-success/10 text-success border-success/20" :
                                                    t.payment_status === 'failed' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                        "bg-warning/10 text-warning border-warning/20"
                                            }>
                                                {t.payment_status === 'paid' ? 'Payé' : t.payment_status === 'failed' ? 'Échoué' : 'En attente'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="icon" variant="ghost" onClick={() => handleViewInvoice(t)}>
                                                <Download className="w-4 h-4 text-muted-foreground" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {t.payment_status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => updatePaymentStatus(t.id, 'paid')}>
                                                            <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                                            Marquer comme Payé
                                                        </DropdownMenuItem>
                                                    )}
                                                    {t.payment_status === 'paid' && (
                                                        <DropdownMenuItem onClick={() => updatePaymentStatus(t.id, 'pending')}>
                                                            <AlertTriangle className="w-4 h-4 mr-2 text-warning" />
                                                            Marquer comme En Attente
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleViewInvoice(t)}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Voir la facture
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <InvoiceDialog
                open={isInvoiceOpen}
                onOpenChange={setIsInvoiceOpen}
                rental={selectedRental}
            />
        </DashboardLayout>
    );
};

export default Accounting;

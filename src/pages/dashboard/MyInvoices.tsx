import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    FileText,
    Calendar,
    Download,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import InvoiceDialog from "@/components/dashboard/InvoiceDialog";

interface Rental {
    id: string;
    start_date: string;
    end_date: string;
    total_price: number;
    status: "pending" | "active" | "completed" | "cancelled";
    payment_status: "pending" | "paid" | "failed";
    invoice_number?: string;
    prestation_type?: string;
    equipment: {
        name: string;
    };
    renter?: {
        full_name: string;
        phone: string;
    };
}

const MyInvoices = () => {
    const { user } = useAuth();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    const fetchInvoices = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch rentals that match the user (as renter)
            let query = supabase.from("rentals")
                .select(`
                    *,
                    equipment (name),
                    renter:renter_id (full_name, phone)
                `)
                .eq("renter_id", user.id)
                .order("created_at", { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            setRentals(data || []);
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const handleViewInvoice = (rental: Rental) => {
        setSelectedRental(rental);
        setIsInvoiceOpen(true);
    };

    // Filter rentals based on search
    const filteredRentals = rentals.filter(rental =>
        rental.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.prestation_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paymentStatusColors = {
        pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        paid: "bg-green-500/10 text-green-500 border-green-500/20",
        failed: "bg-destructive/10 text-destructive border-destructive/20",
    };

    const paymentStatusLabels = {
        pending: "En attente",
        paid: "Payée",
        failed: "Échouée",
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display">Mes Factures</h1>
                        <p className="text-muted-foreground">Consultez et téléchargez vos factures de prestations</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par matériel ou n° facture..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Désignation</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>État du Paiement</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Chargement...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRentals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText className="w-8 h-8 opacity-20" />
                                            <p>Aucune facture trouvée</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRentals.map((rental) => (
                                    <TableRow key={rental.id} className="hover:bg-muted/5">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{rental.prestation_type ? `Service: ${rental.prestation_type}` : rental.equipment.name}</span>
                                                {rental.invoice_number && (
                                                    <span className="text-xs text-muted-foreground">Ref: {rental.invoice_number}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{new Date(rental.start_date).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(rental.total_price)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={paymentStatusColors[rental.payment_status] || paymentStatusColors.pending}>
                                                {paymentStatusLabels[rental.payment_status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(rental)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Voir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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

export default MyInvoices;

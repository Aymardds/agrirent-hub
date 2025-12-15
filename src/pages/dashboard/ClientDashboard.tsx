import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ShoppingCart, FileText, Package, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface Rental {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    total_price: number;
    equipment: {
        name: string;
    };
}

const ClientDashboard = () => {
    const { user } = useAuth();
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyRentals = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("rentals")
                .select("*, equipment(name)")
                .eq('renter_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRentals(data || []);
            setLoading(false);
        };
        fetchMyRentals();
    }, [user]);

    const stats = {
        active: rentals.filter(r => r.status === 'active').length,
        pending: rentals.filter(r => r.status === 'pending').length,
        total: rentals.length,
    };

    const statusLabels: Record<string, string> = {
        pending: "En attente",
        active: "En cours",
        completed: "Terminée",
        cancelled: "Annulée",
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-display">Tableau de bord Client</h1>
                    <p className="text-muted-foreground">Bienvenue {user?.user_metadata?.full_name || 'Client'}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Locations actives</p>
                                <h3 className="text-2xl font-bold">{stats.active}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">En attente</p>
                                <h3 className="text-2xl font-bold">{stats.pending}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total locations</p>
                                <h3 className="text-2xl font-bold">{stats.total}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Rentals */}
                <Card>
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Mes locations récentes</h2>
                            <Link to="/dashboard/my-rentals">
                                <Button variant="ghost" size="sm">Voir tout</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y">
                        {loading ? (
                            <div className="p-6 text-center text-muted-foreground">Chargement...</div>
                        ) : rentals.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Aucune location trouvée</p>
                            </div>
                        ) : (
                            rentals.map(rental => (
                                <div key={rental.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{rental.equipment.name}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>{rental.start_date}</span>
                                                <span>→</span>
                                                <span>{rental.end_date}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                {statusLabels[rental.status] || rental.status}
                                            </Badge>
                                            <p className="text-sm font-semibold mt-1">{rental.total_price.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/dashboard/catalog">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Catalogue</h3>
                                    <p className="text-sm text-muted-foreground">Louer du matériel</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link to="/dashboard/my-rentals">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Mes Locations</h3>
                                    <p className="text-sm text-muted-foreground">Gérer mes locations</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link to="/dashboard/my-invoices">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Factures</h3>
                                    <p className="text-sm text-muted-foreground">Voir mes factures</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ClientDashboard;

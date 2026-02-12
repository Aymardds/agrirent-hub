import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    ShoppingCart,
    FileText,
    Package,
    TrendingUp,
    MapPin,
    CheckCircle2,
    Clock,
    Wallet,
    BarChart3,
    Tractor,
    Home,
    CalendarPlus,
    RefreshCw,
    CreditCard,
    Wheat,
    DollarSign,
    ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useClientDashboardStats, useRecentRentals } from "@/hooks/useDashboardData";
import { useCreditStats } from "@/hooks/usePayments";
import { supabase } from "@/lib/supabase";

const ClientDashboard = () => {
    const { user } = useAuth();
    const { data: stats, isLoading: statsLoading } = useClientDashboardStats(user?.id);
    const { data: recentRentals, isLoading: rentalsLoading } = useRecentRentals(5);
    const { data: creditStats } = useCreditStats(user?.id);
    const [propertiesCount, setPropertiesCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchPropertiesCount();
        }
    }, [user]);

    const fetchPropertiesCount = async () => {
        try {
            const { count, error } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('owner_id', user!.id);

            if (error) throw error;
            setPropertiesCount(count || 0);
        } catch (error) {
            console.error('Error fetching properties count:', error);
        }
    };

    if (statsLoading || rentalsLoading) {
        return (
            <DashboardLayout>
                <div className="h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    // Calculate totals
    const creditsToPayAtHarvest = creditStats?.totalRemaining || 0;
    const amountPaid = stats?.paidAmount || 0; // Sum of completed and paid prestations
    const totalAmount = creditsToPayAtHarvest + amountPaid; // Sum of credits and paid amount
    const totalPrestations = stats?.transactionCount || 0; // Total number of all rentals

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold font-display mb-2">
                        Bonjour, {user?.user_metadata?.full_name?.split(' ')[0] || 'Client'} 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Voici un aperçu de votre activité agricole
                    </p>
                </div>

                {/* Main Stats Cards - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Credits to Pay at Harvest */}
                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <Wheat className="w-6 h-6 text-orange-600" />
                            </div>
                            {creditStats && creditStats.overdueCredits > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {creditStats.overdueCredits} en retard
                                </Badge>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Crédits à payer à la récolte</p>
                            <p className="text-3xl font-bold text-orange-700 mb-3">
                                {formatCurrency(creditsToPayAtHarvest)}
                            </p>
                            <Link to="/dashboard/my-rentals">
                                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-0">
                                    Voir les détails <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Amount Paid */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Montant payé</p>
                            <p className="text-3xl font-bold text-green-700 mb-3">
                                {formatCurrency(amountPaid)}
                            </p>
                            <p className="text-xs text-green-600">
                                ✓ Paiements effectués
                            </p>
                        </div>
                    </Card>

                    {/* Total Amount */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                            <p className="text-3xl font-bold text-blue-700 mb-3">
                                {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-xs text-blue-600">
                                Total des prestations
                            </p>
                        </div>
                    </Card>

                    {/* Number of Properties */}
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Home className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Mes propriétés</p>
                            <p className="text-3xl font-bold text-purple-700 mb-3">
                                {propertiesCount}
                            </p>
                            <Link to="/dashboard/properties">
                                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-0">
                                    Gérer <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Total Prestations */}
                    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 border-indigo-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Tractor className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total prestations</p>
                            <p className="text-3xl font-bold text-indigo-700 mb-3">
                                {totalPrestations}
                            </p>
                            <Link to="/dashboard/my-rentals">
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0">
                                    Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Quick Action Card */}
                    <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950/20 dark:to-gray-900/10 border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nouvelle prestation</p>
                            <p className="text-lg font-semibold mb-3">
                                Louer du matériel
                            </p>
                            <Link to="/dashboard/catalog">
                                <Button size="sm" className="w-full">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Voir le catalogue
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Recent Rentals Section */}
                {recentRentals && recentRentals.length > 0 && (
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Prestations récentes</h2>
                            <Link to="/dashboard/my-rentals">
                                <Button variant="ghost" size="sm">
                                    Voir tout <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentRentals.slice(0, 3).map((rental: any) => (
                                <div key={rental.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Tractor className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{rental.equipment?.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(rental.start_date).toLocaleDateString('fr-FR')} - {new Date(rental.end_date).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(rental.total_price)}</p>
                                        <Badge variant={
                                            rental.status === 'completed' ? 'default' :
                                                rental.status === 'active' ? 'secondary' :
                                                    rental.status === 'cancelled' ? 'destructive' : 'outline'
                                        } className="text-xs">
                                            {rental.status === 'completed' ? 'Terminé' :
                                                rental.status === 'active' ? 'En cours' :
                                                    rental.status === 'cancelled' ? 'Annulé' : 'En attente'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ClientDashboard;

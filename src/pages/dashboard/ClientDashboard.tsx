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
    CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useClientDashboardStats, useRecentRentals } from "@/hooks/useDashboardData";
import StatsCard from "@/components/dashboard/StatsCard";
import ClientDashboardCharts from "@/components/dashboard/ClientDashboardCharts";

const ClientDashboard = () => {
    const { user } = useAuth();
    const { data: stats, isLoading: statsLoading } = useClientDashboardStats(user?.id);
    const { data: recentRentals, isLoading: rentalsLoading } = useRecentRentals(5);

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

    // Highlights to keep as cards (Indicators that fit single values better)
    const highlights = [
        {
            title: "Localité",
            value: stats?.locality || "Non renseignée",
            change: "Exploitation",
            changeType: "neutral" as const,
            icon: MapPin,
            iconColor: "bg-orange-500/10 text-orange-500",
        },
        {
            title: "Montant Total",
            value: formatCurrency(stats?.totalAmount || 0),
            change: "Cumul financier",
            changeType: "neutral" as const,
            icon: Wallet,
            iconColor: "bg-purple-500/10 text-purple-500",
        },
        {
            title: "Montant payé",
            value: formatCurrency(stats?.paidAmount || 0),
            change: "Réglé",
            changeType: "positive" as const,
            icon: CheckCircle2,
            iconColor: "bg-success/10 text-success",
        },
        {
            title: "Montant restant",
            value: formatCurrency(stats?.remainingAmount || 0),
            change: "À payer",
            changeType: "negative" as const,
            icon: Wallet,
            iconColor: "bg-destructive/10 text-destructive",
        },
        {
            title: "Taux d'exécution",
            value: `${stats?.executionRate || 0}%`,
            change: "Secteur traité",
            changeType: "positive" as const,
            icon: CheckCircle2,
            iconColor: "bg-success/10 text-success",
        },
        {
            title: "Taux de recouvrement",
            value: `${stats?.recoveryRate || 0}%`,
            change: "Paiement effectif",
            changeType: "neutral" as const,
            icon: BarChart3,
            iconColor: "bg-primary/10 text-primary",
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display">Tableau de bord {user?.user_metadata?.role === 'cooperative' ? 'Coopérative' : 'Agriculteur'}</h1>
                        <p className="text-muted-foreground">Bienvenue {user?.user_metadata?.full_name || 'Agriculteur'}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/dashboard/catalog">
                            <Button variant="hero">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Nouvelle prestation
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Section Indicateurs Clés */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        Indicateurs Clés
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {highlights.map((stat, index) => (
                            <StatsCard key={index} {...stat} />
                        ))}
                    </div>
                </div>

                {/* Section Graphiques */}
                <ClientDashboardCharts stats={stats} />

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Recent Prestations */}
                    <Card className="lg:col-span-2">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Mes prestations récentes</h2>
                            <Link to="/dashboard/my-rentals">
                                <Button variant="ghost" size="sm">Voir tout</Button>
                            </Link>
                        </div>
                        <div className="divide-y max-h-[400px] overflow-y-auto">
                            {recentRentals && recentRentals.length > 0 ? (
                                recentRentals.map((rental: any) => (
                                    <div key={rental.id} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{rental.equipment?.name || "Prestation"}</h4>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span>{new Date(rental.start_date).toLocaleDateString()}</span>
                                                    <span>→</span>
                                                    <span>{new Date(rental.end_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                    {rental.status === 'completed' ? 'Terminée' :
                                                        rental.status === 'active' ? 'En cours' :
                                                            rental.status === 'pending' ? 'En attente' : 'Annulée'}
                                                </Badge>
                                                <p className="text-sm font-semibold mt-1">{rental.total_price.toLocaleString()} FCFA</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Aucune prestation trouvée</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Actions / Links */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">Actions rapides</h3>
                            <div className="space-y-3">
                                <Link to="/dashboard/catalog" className="block">
                                    <Button variant="outline" className="w-full justify-start">
                                        <CalendarPlus className="w-4 h-4 mr-2" />
                                        Planifier une prestation
                                    </Button>
                                </Link>
                                <Link to="/dashboard/my-rentals" className="block">
                                    <Button variant="outline" className="w-full justify-start">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Relancer une prestation en attente
                                    </Button>
                                </Link>
                                <Link to="/dashboard/my-rentals" className="block">
                                    <Button variant="outline" className="w-full justify-start">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Régler une prestation
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ClientDashboard;

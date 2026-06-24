import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Calendar, Loader2 } from "lucide-react";
import { useDashboardStats, useMonthlyPerformance, useUserGrowth } from "@/hooks/useDashboardData";

const Stats = () => {
    const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
    const { data: performance, isLoading: isPerfLoading } = useMonthlyPerformance();
    const { data: userGrowth, isLoading: isUserGrowthLoading } = useUserGrowth();

    const isLoading = isStatsLoading || isPerfLoading || isUserGrowthLoading;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Chargement des statistiques...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('XOF', 'FCFA');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold font-display">Statistiques Détaillées</h1>
                    <p className="text-muted-foreground">Analyses et rapports de performance avec données réelles</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Taux d'occupation</p>
                                <h3 className="text-2xl font-bold">{performance?.occupancyRate || 0}%</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Chiffre d'affaires (Mois)</p>
                                <h3 className="text-2xl font-bold text-success">{formatCurrency(stats?.monthlyRevenue || 0)}</h3>
                                {stats?.revenueChange ? (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats.revenueChange > 0 ? "+" : ""}{stats.revenueChange.toFixed(1)}% vs mois préc.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Nouveaux Clients (Mois)</p>
                                <h3 className="text-2xl font-bold">+{userGrowth?.thisMonth || 0}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Locations Actives</p>
                                <h3 className="text-2xl font-bold">{stats?.activeRentalsCount || 0}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="bg-muted/20 border border-dashed rounded-xl p-12 text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Graphiques détaillés</h3>
                    <p>Les données réelles de graphiques interactifs seront bientôt disponibles.</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Stats;

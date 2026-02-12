import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, CreditCard, AlertCircle } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { cn } from "@/lib/utils";

export function FinancialSummaryCards() {
    const { data, isLoading } = useFinancialData();
    const stats = data?.stats;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 bg-muted rounded w-24"></div>
                    </CardContent>
                </Card>
            ))}
        </div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        {stats?.revenueGrowth && stats.revenueGrowth > 0 ? (
                            <span className="text-green-600 flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +{stats.revenueGrowth.toFixed(1)}%
                            </span>
                        ) : stats?.revenueGrowth && stats.revenueGrowth < 0 ? (
                            <span className="text-red-600 flex items-center">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                {stats.revenueGrowth.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="text-muted-foreground">0%</span>
                        )}
                        <span className="ml-1">vs mois dernier</span>
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalExpenses || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        {stats?.expenseGrowth && stats.expenseGrowth > 0 ? (
                            <span className="text-red-600 flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +{stats.expenseGrowth.toFixed(1)}%
                            </span>
                        ) : stats?.expenseGrowth && stats.expenseGrowth < 0 ? (
                            <span className="text-green-600 flex items-center">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                {stats.expenseGrowth.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="text-muted-foreground">0%</span>
                        )}
                        <span className="ml-1">vs mois dernier</span>
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Nette</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold",
                        (stats?.netBalance || 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {formatCurrency(stats?.netBalance || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Profit net actuel
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Crédits à Recevoir</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.pendingRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        + {formatCurrency(stats?.pendingExpenses || 0)} de dépenses en attente
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

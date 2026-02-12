import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { FinancialCharts } from "@/components/dashboard/FinancialCharts";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenses } from "@/hooks/useExpenses";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const AccountantDashboard = () => {
    const { user } = useAuth();
    const { data: recentExpenses } = useExpenses();

    // Take only the last 5 expenses
    const latestExpenses = recentExpenses?.slice(0, 5) || [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <Badge className="bg-green-100 text-green-800 border-green-200">Payé</Badge>;
            case "approved": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Approuvé</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-display mb-2">
                        Tableau de Bord Financier
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenue, {user?.user_metadata?.full_name || 'Comptable'}. Voici la situation financière globale.
                    </p>
                </div>

                {/* KPI Cards */}
                <FinancialSummaryCards />

                {/* Charts */}
                <FinancialCharts />

                {/* Recent Activity / Expenses */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dernières Dépenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {latestExpenses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Aucune dépense récente
                                    </p>
                                ) : (
                                    latestExpenses.map(expense => (
                                        <div key={expense.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm">{expense.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(expense.expense_date), "d MMM yyyy", { locale: fr })} • {expense.category === 'equipment' ? 'Matériel' : expense.category === 'personnel' ? 'Personnel' : 'Prestation'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-sm">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                                {getStatusBadge(expense.status)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for Recent Incomes or other widgets */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <a href="/dashboard/expenses" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <span className="font-semibold">Gérer les Dépenses</span>
                                    <span className="text-xs text-muted-foreground mt-1">Ajouter, modifier, valider</span>
                                </a>
                                <a href="/dashboard/invoices" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <span className="font-semibold">Facturation</span>
                                    <span className="text-xs text-muted-foreground mt-1">Voir toutes les factures</span>
                                </a>
                                <a href="/dashboard/payments" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <span className="font-semibold">Paiements</span>
                                    <span className="text-xs text-muted-foreground mt-1">Historique des transactions</span>
                                </a>
                                <a href="/dashboard/finances" className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <span className="font-semibold">Rapports</span>
                                    <span className="text-xs text-muted-foreground mt-1">Exports et analyses</span>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AccountantDashboard;

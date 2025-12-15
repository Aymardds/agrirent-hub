import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertTriangle, FileText, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const AccountantDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayments: 0,
        paidCount: 0,
        totalTransactions: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            let query = supabase
                .from("rentals")
                .select("total_price, payment_status, equipment!inner(owner_id)");

            if (user.user_metadata?.role !== 'super_admin') {
                query = query.eq('equipment.owner_id', user.id);
            }

            const { data } = await query;

            if (data) {
                setStats({
                    totalRevenue: data.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.total_price, 0),
                    pendingPayments: data.filter(r => r.payment_status === 'pending').reduce((sum, r) => sum + r.total_price, 0),
                    paidCount: data.filter(r => r.payment_status === 'paid').length,
                    totalTransactions: data.length,
                });
            }
        };
        fetchStats();
    }, [user]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-display">Tableau de bord Comptabilité</h1>
                    <p className="text-muted-foreground">Bienvenue {user?.user_metadata?.full_name || 'Comptable'}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 text-success rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Revenu Total</p>
                                <h3 className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</h3>
                                <p className="text-xs text-muted-foreground">FCFA</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">En attente</p>
                                <h3 className="text-2xl font-bold">{stats.pendingPayments.toLocaleString()}</h3>
                                <p className="text-xs text-muted-foreground">FCFA</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Payés</p>
                                <h3 className="text-2xl font-bold">{stats.paidCount}</h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Transactions</p>
                                <h3 className="text-2xl font-bold">{stats.totalTransactions}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link to="/dashboard/invoices">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Facturation</h3>
                                    <p className="text-sm text-muted-foreground">Gérer les factures</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link to="/dashboard/finances">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success/10 text-success rounded-xl">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">États Financiers</h3>
                                    <p className="text-sm text-muted-foreground">Rapports détaillés</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link to="/dashboard/payments">
                        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Paiements</h3>
                                    <p className="text-sm text-muted-foreground">Suivi des paiements</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AccountantDashboard;

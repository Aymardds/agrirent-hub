import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  Users,
  Package,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { normalizeRole } from "@/lib/roleUtils";
import { useEffect, useState } from "react";
import {
  useDashboardStats,
  useRecentRentals,
  useMonthlyPerformance,
  useUserGrowth,
  useEquipmentGrowth,
} from "@/hooks/useDashboardData";

// Import role-specific dashboards
import TechnicianDashboard from "./dashboard/TechnicianDashboard";
import ClientDashboard from "./dashboard/ClientDashboard";
import StockManagerDashboard from "./dashboard/StockManagerDashboard";
import AccountantDashboard from "./dashboard/AccountantDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Récupérer les données réelles
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentRentals, isLoading: rentalsLoading, error: rentalsError } = useRecentRentals(4);
  const { data: performance, isLoading: performanceLoading, error: performanceError } = useMonthlyPerformance();
  const { data: userGrowth } = useUserGrowth();
  const { data: equipmentGrowth } = useEquipmentGrowth();

  // Detect if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.error("Loading timeout - Authentication issue detected");
        setLoadingTimeout(true);
      }
    }, 5000); // 5 seconds timeout

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erreur de connexion</h2>
          <p className="text-muted-foreground mb-4">
            La connexion à Supabase prend trop de temps. Vérifiez votre fichier .env et votre connexion internet.
          </p>
          <Button onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Si le problème persiste, vérifiez la console (F12) pour plus de détails.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const role = normalizeRole(user.user_metadata?.role);

  console.log('🎯 Dashboard Dispatcher - Rendering dashboard for role:', role);

  // --- ROLE BASED CONTENT DISPATCHER ---
  // Instead of redirecting to a different URL, we render the correct component directly.
  // This keeps the URL as /dashboard while showing correct content.

  if (role === 'technician') {
    return <TechnicianDashboard />;
  }

  if (role === 'client') {
    return <ClientDashboard />;
  }

  if (role === 'stock_manager') {
    return <StockManagerDashboard />;
  }

  if (role === 'accountant') {
    return <AccountantDashboard />;
  }

  // --- DEFAULT ADMIN / SUPER ADMIN DASHBOARD ---
  // If role is super_admin, admin, or fallback (if enforced by ProtectedRoute)

  // Afficher un loader pendant le chargement des données
  if (statsLoading || rentalsLoading || performanceLoading) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Afficher une erreur si les données n'ont pas pu être chargées
  if (statsError || rentalsError || performanceError) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-4">
              Impossible de charger les données du dashboard. Vérifiez votre connexion.
            </p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Formater les revenus en FCFA
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  // Préparer les statistiques avec les données réelles
  const stats = [
    {
      title: "Utilisateurs",
      value: dashboardStats?.usersCount.toString() || "0",
      change: userGrowth ? `${userGrowth.growth > 0 ? '+' : ''}${userGrowth.growth}%` : "+0%",
      changeType: (userGrowth?.growth || 0) >= 0 ? "positive" as const : "negative" as const,
      icon: Users,
      iconColor: "bg-info/10 text-info",
    },
    {
      title: "Matériels",
      value: dashboardStats?.equipmentCount.toString() || "0",
      change: equipmentGrowth ? `+${equipmentGrowth.addedThisMonth}` : "+0",
      changeType: "positive" as const,
      icon: Package,
      iconColor: "bg-primary/10 text-primary",
    },
    {
      title: "Locations actives",
      value: dashboardStats?.activeRentalsCount.toString() || "0",
      change: "En cours",
      changeType: "neutral" as const,
      icon: Calendar,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Revenus du mois",
      value: formatCurrency(dashboardStats?.monthlyRevenue || 0),
      change: `${dashboardStats?.revenueChange && dashboardStats.revenueChange > 0 ? '+' : ''}${Math.round(dashboardStats?.revenueChange || 0)}%`,
      changeType: (dashboardStats?.revenueChange || 0) >= 0 ? "positive" as const : "negative" as const,
      icon: CreditCard,
      iconColor: "bg-secondary/10 text-secondary",
    },
  ];

  const statusStyles = {
    active: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    completed: "bg-muted text-muted-foreground",
  };

  const statusLabels = {
    active: "En cours",
    pending: "En attente",
    completed: "Terminée",
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground">
              Bienvenue dans l'espace d'administration.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              Exporter
            </Button>
            <Button variant="hero">
              Nouvelle location
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Rentals */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Locations récentes</h2>
              <Button variant="ghost" size="sm">Voir tout</Button>
            </div>
            <div className="divide-y divide-border">
              {recentRentals && recentRentals.length > 0 ? (
                recentRentals.map((rental: any) => {
                  const equipment = Array.isArray(rental.equipment) ? rental.equipment[0] : rental.equipment;
                  const client = Array.isArray(rental.client) ? rental.client[0] : rental.client;
                  const equipmentName = equipment?.name || "Matériel inconnu";
                  const clientName = client?.full_name || client?.company || "Client inconnu";
                  const rentalDate = new Date(rental.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div key={rental.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{equipmentName}</p>
                        <p className="text-sm text-muted-foreground">{clientName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusStyles[rental.status as keyof typeof statusStyles] || statusStyles.pending}`}>
                          {statusLabels[rental.status as keyof typeof statusLabels] || "En attente"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{rentalDate}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune location récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats & Activity */}
          <div className="space-y-6">
            {/* Performance */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Performance ce mois</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-sm text-muted-foreground">Taux d'occupation</span>
                  </div>
                  <span className="font-semibold text-foreground">{performance?.occupancyRate || 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${performance?.occupancyRate || 0}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">Locations terminées</span>
                  </div>
                  <span className="font-medium">{performance?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-muted-foreground">En attente</span>
                  </div>
                  <span className="font-medium">{performance?.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-muted-foreground">Retards</span>
                  </div>
                  <span className="font-medium">{performance?.overdue || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Ajouter un matériel
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Nouveau client
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier une location
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

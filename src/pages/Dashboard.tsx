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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    {
      title: "Utilisateurs",
      value: "1,248",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      iconColor: "bg-info/10 text-info",
    },
    {
      title: "Matériels",
      value: "248",
      change: "+5",
      changeType: "positive" as const,
      icon: Package,
      iconColor: "bg-primary/10 text-primary",
    },
    {
      title: "Locations actives",
      value: "56",
      change: "En cours",
      changeType: "neutral" as const,
      icon: Calendar,
      iconColor: "bg-success/10 text-success",
    },
    {
      title: "Revenus du mois",
      value: "4.2M FCFA",
      change: "+18%",
      changeType: "positive" as const,
      icon: CreditCard,
      iconColor: "bg-secondary/10 text-secondary",
    },
  ];

  const recentRentals = [
    { id: "LOC-001", client: "Coopérative Ndiaganiao", equipment: "Tracteur John Deere 5055E", status: "active", date: "15 Jan 2024" },
    { id: "LOC-002", client: "Ferme Diallo", equipment: "Moissonneuse-batteuse", status: "pending", date: "14 Jan 2024" },
    { id: "LOC-003", client: "SARL AgriPlus", equipment: "Pulvérisateur 600L", status: "completed", date: "13 Jan 2024" },
    { id: "LOC-004", client: "GIE Touba Agri", equipment: "Semoir pneumatique", status: "active", date: "12 Jan 2024" },
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
    <DashboardLayout userRole="super_admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground">
              Bienvenue, Moussa. Voici un aperçu de votre activité.
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
              {recentRentals.map((rental) => (
                <div key={rental.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{rental.equipment}</p>
                    <p className="text-sm text-muted-foreground">{rental.client}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusStyles[rental.status as keyof typeof statusStyles]}`}>
                      {statusLabels[rental.status as keyof typeof statusLabels]}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{rental.date}</p>
                  </div>
                </div>
              ))}
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
                  <span className="font-semibold text-foreground">78%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[78%] rounded-full bg-success" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">Locations terminées</span>
                  </div>
                  <span className="font-medium">42</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-muted-foreground">En attente</span>
                  </div>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <span className="text-muted-foreground">Retards</span>
                  </div>
                  <span className="font-medium">3</span>
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

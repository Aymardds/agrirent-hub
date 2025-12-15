import { 
  ShieldCheck, 
  Settings, 
  Package, 
  Wrench, 
  User, 
  Calculator 
} from "lucide-react";

const Roles = () => {
  const roles = [
    {
      icon: ShieldCheck,
      title: "Super Admin",
      description: "Vision globale de la plateforme, supervision des utilisateurs et accès à tous les tableaux de bord.",
      color: "from-primary to-primary/80",
    },
    {
      icon: Settings,
      title: "Admin",
      description: "Gestion des utilisateurs, configuration des catégories et validation des opérations sensibles.",
      color: "from-info to-info/80",
    },
    {
      icon: Package,
      title: "Gestionnaire Stock",
      description: "Gestion complète du matériel, plannings de disponibilité et suivi des mouvements.",
      color: "from-success to-success/80",
    },
    {
      icon: Wrench,
      title: "Technicien",
      description: "Visualisation des missions assignées, suivi des interventions et historique terrain.",
      color: "from-accent to-accent/80",
    },
    {
      icon: User,
      title: "Client",
      description: "Accès au catalogue, demandes de location, suivi des commandes et factures.",
      color: "from-secondary to-secondary/80",
    },
    {
      icon: Calculator,
      title: "Comptabilité",
      description: "Facturation, états financiers, suivi des paiements et exports comptables.",
      color: "from-warning to-warning/80",
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Multi-Rôles
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Un espace dédié pour chaque utilisateur
          </h2>
          <p className="text-lg text-muted-foreground">
            Des tableaux de bord personnalisés selon votre rôle dans l'organisation, 
            avec les fonctionnalités et données pertinentes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-8 border border-border hover:border-transparent transition-all duration-300 hover:shadow-xl overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <role.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {role.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roles;

import { 
  Tractor, 
  Package, 
  Users, 
  BarChart3, 
  Calendar, 
  Shield,
  Wrench,
  CreditCard
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Tractor,
      title: "Location de Matériel",
      description: "Accédez à un large catalogue de matériel motorisé agricole. Tracteurs, moissonneuses, et plus encore.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Package,
      title: "Gestion de Stock",
      description: "Suivez la disponibilité en temps réel, gérez les entrées/sorties et optimisez votre inventaire.",
      color: "bg-success/10 text-success",
    },
    {
      icon: Users,
      title: "Multi-Utilisateurs",
      description: "Rôles dédiés pour admins, gestionnaires, techniciens et clients avec permissions personnalisées.",
      color: "bg-info/10 text-info",
    },
    {
      icon: Calendar,
      title: "Planning Intelligent",
      description: "Planifiez les locations et interventions avec notre système de calendrier intuitif.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Wrench,
      title: "Suivi Technique",
      description: "Assignez des techniciens, suivez les interventions et gérez la maintenance préventive.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: CreditCard,
      title: "Facturation Intégrée",
      description: "Génération automatique des factures, suivi des paiements et états financiers détaillés.",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: BarChart3,
      title: "Analytics & Rapports",
      description: "Tableaux de bord par rôle, KPIs métier et exports de données personnalisés.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Shield,
      title: "Sécurité Avancée",
      description: "Protection des données, traçabilité complète et conformité aux normes en vigueur.",
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/30" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin pour gérer votre activité
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète conçue pour les professionnels de l'agriculture au Sénégal et en Afrique de l'Ouest.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card hover:bg-card/80 rounded-2xl p-6 border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

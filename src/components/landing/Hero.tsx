import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const features = [
    "Location de matériel motorisé",
    "Gestion de stock en temps réel",
    "Suivi des prestations terrain",
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.08)_0%,transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium">Plateforme #1 en Côte d'Ivoire</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Louez et gérez votre{" "}
              <span className="text-primary">matériel agricole</span>{" "}
              en toute simplicité
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              OUTILTECH simplifie l'accès au matériel motorisé pour les agriculteurs,
              coopératives et prestataires techniques. Gérez vos locations, stocks et
              prestations depuis une plateforme unique.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Démarrer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                <Play className="w-5 h-5" />
                Voir la démo
              </Button>
            </div>

            <p className="text-sm text-muted-foreground/60 mb-8 animate-fade-up" style={{ animationDelay: "0.35s" }}>
              Propulsé par{" "}
              <a
                href="https://www.grainotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Grainotech SAS
              </a>
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <div className="relative z-10">
              {/* Dashboard Preview Card */}
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="bg-sidebar p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-sidebar-foreground/60">dashboard.outiltech.sn</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Matériels", value: "248", color: "bg-primary/10 text-primary" },
                      { label: "Locations", value: "56", color: "bg-success/10 text-success" },
                      { label: "Revenus", value: "12.4M", color: "bg-secondary/10 text-secondary" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.color} rounded-xl p-4`}>
                        <p className="text-2xl font-display font-bold">{stat.value}</p>
                        <p className="text-xs opacity-80">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <div className="w-5 h-5 bg-primary/30 rounded" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-foreground/10 rounded w-3/4 mb-2" />
                          <div className="h-2 bg-foreground/5 rounded w-1/2" />
                        </div>
                        <div className="h-8 w-20 rounded-lg bg-success/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-6 -right-6 bg-card rounded-xl shadow-xl border border-border p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location confirmée</p>
                    <p className="text-xs text-muted-foreground">Tracteur John Deere</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-6 bg-card rounded-xl shadow-xl border border-border p-4 animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">+15 matériels</p>
                    <p className="text-xs text-muted-foreground">ajoutés ce mois</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

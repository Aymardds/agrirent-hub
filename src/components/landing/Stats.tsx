import { useLandingStats } from "@/hooks/useLandingStats";

const Stats = () => {
  const { data: stats } = useLandingStats();

  const statItems = [
    { value: `${stats?.equipmentCount || 0}`, label: "Matériels disponibles" },
    { value: `${stats?.rentalsCount || 0}+`, label: "Prestations réalisées" },
    { value: `${stats?.usersCount || 0}+`, label: "Clients inscrits" },
    { value: `${stats?.occupancyRate || 0}%`, label: "Taux de réalisation" },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="gradient-hero rounded-3xl p-12 md:p-16 relative overflow-hidden">
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Des chiffres qui parlent
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
                OUTILTECH accompagne déjà des centaines d'agriculteurs et prestataires
                dans la gestion de leur matériel.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statItems.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm"
                >
                  <p className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                    {stat.value}
                  </p>
                  <p className="text-primary-foreground/70 text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;

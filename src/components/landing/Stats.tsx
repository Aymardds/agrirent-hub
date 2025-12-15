import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Stats = () => {
  const [stats, setStats] = useState([
    { value: "0+", label: "Matériels disponibles" },
    { value: "0+", label: "Locations réalisées" },
    { value: "0+", label: "Clients satisfaits" },
    { value: "98%", label: "Taux de satisfaction" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch equipment count
        const { count: equipmentCount } = await supabase
          .from("equipment")
          .select("*", { count: "exact", head: true });

        // Fetch rentals count
        const { count: rentalsCount } = await supabase
          .from("rentals")
          .select("*", { count: "exact", head: true });

        // Fetch users count (as clients)
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        setStats([
          { value: `${equipmentCount || 0}+`, label: "Matériels disponibles" },
          { value: `${rentalsCount || 0}+`, label: "Locations réalisées" },
          { value: `${usersCount || 0}+`, label: "Clients inscrits" }, // Changed from "Clients satisfaits" to be more accurate
          { value: "98%", label: "Taux de satisfaction" },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

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
              {stats.map((stat, index) => (
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

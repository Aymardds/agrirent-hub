import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List, MapPin, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { BookingDialog } from "@/components/booking/BookingDialog";

interface ServicePrice {
  amount: number;
  unit: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  prices: ServicePrice[];
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  service_type: string;
  price: number;
  price_unit: string;
  location: string;
  available: boolean;
  image_url: string;
  gallery: string[];
  specs: string[];
  equipment_services?: Service[];
}

const Catalogue = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const categories = [
    "Tous", "Tracteurs", "Moissonneuses", "Semoirs", "Pulvérisateurs", "Autre"
  ];

  useEffect(() => {
    fetchEquipment();
  }, [selectedCategory]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("equipment")
        .select("*, equipment_services(*)")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "Tous") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEquipment(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Catalogue de Matériel
            </h1>
            <p className="text-lg text-muted-foreground">
              Découvrez notre gamme complète de matériel agricole disponible à la location.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-12">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`h-12 w-12 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`h-12 w-12 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Equipment Grid */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              Aucun matériel trouvé dans cette catégorie.
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {filteredEquipment.map((item) => (
                <div
                  key={item.id}
                  className={`bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all group ${viewMode === "list" ? "flex" : ""}`}
                >
                  {/* Image */}
                  <div className={`bg-muted flex items-center justify-center relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : "h-48"}`}>
                    {item.image_url && !item.image_url.startsWith('tractor-default') ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-6xl">🚜</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full mr-2">
                          {item.category}
                        </span>
                        <span className="text-xs font-medium text-secondary-foreground bg-secondary px-2 py-1 rounded-full">
                          {item.service_type === 'vente' ? 'Vente' : 'Location'}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.available
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                        }`}>
                        {item.available ? "Disponible" : (item.service_type === 'vente' ? "Vendu" : "Loué")}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.specs && item.specs.map((spec, i) => (
                        <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <span className="text-2xl font-display font-bold text-foreground">{item.price?.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground ml-1">
                          {item.service_type === 'vente' ? 'FCFA' : `${item.price_unit ? 'FCFA/' + item.price_unit : 'FCFA/j'}`}
                        </span>
                      </div>

                      {item.available ? (
                        <BookingDialog equipment={item} />
                      ) : (
                        <Button variant="outline" disabled>
                          Indisponible
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalogue;

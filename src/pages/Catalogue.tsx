import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Search, Filter, Grid, List, MapPin, Calendar } from "lucide-react";

const Catalogue = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = [
    "Tous", "Tracteurs", "Moissonneuses", "Semoirs", "Pulvérisateurs", "Remorques"
  ];

  const equipment = [
    {
      id: 1,
      name: "Tracteur John Deere 5055E",
      category: "Tracteurs",
      price: "75,000",
      priceUnit: "FCFA/jour",
      location: "Dakar",
      available: true,
      image: "🚜",
      specs: ["55 CV", "4WD", "Cabine climatisée"],
    },
    {
      id: 2,
      name: "Moissonneuse-batteuse Claas",
      category: "Moissonneuses",
      price: "150,000",
      priceUnit: "FCFA/jour",
      location: "Thiès",
      available: true,
      image: "🌾",
      specs: ["6m coupe", "330 CV", "GPS intégré"],
    },
    {
      id: 3,
      name: "Semoir pneumatique Amazone",
      category: "Semoirs",
      price: "45,000",
      priceUnit: "FCFA/jour",
      location: "Kaolack",
      available: false,
      image: "🌱",
      specs: ["4m largeur", "24 rangs", "Dosage précis"],
    },
    {
      id: 4,
      name: "Pulvérisateur traîné 600L",
      category: "Pulvérisateurs",
      price: "35,000",
      priceUnit: "FCFA/jour",
      location: "Saint-Louis",
      available: true,
      image: "💧",
      specs: ["600L cuve", "12m rampe", "Pompe 150L/min"],
    },
    {
      id: 5,
      name: "Tracteur Massey Ferguson 385",
      category: "Tracteurs",
      price: "65,000",
      priceUnit: "FCFA/jour",
      location: "Dakar",
      available: true,
      image: "🚜",
      specs: ["85 CV", "2WD", "Chargeur frontal"],
    },
    {
      id: 6,
      name: "Remorque agricole 8T",
      category: "Remorques",
      price: "25,000",
      priceUnit: "FCFA/jour",
      location: "Ziguinchor",
      available: true,
      image: "🛒",
      specs: ["8 tonnes", "Benne basculante", "Frein hydraulique"],
    },
  ];

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
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  index === 0 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Equipment Grid */}
          <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {equipment.map((item) => (
              <div 
                key={item.id} 
                className={`bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all group ${viewMode === "list" ? "flex" : ""}`}
              >
                {/* Image */}
                <div className={`bg-muted flex items-center justify-center ${viewMode === "list" ? "w-48 flex-shrink-0" : "h-48"}`}>
                  <span className="text-6xl">{item.image}</span>
                </div>

                {/* Content */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.available 
                        ? "bg-success/10 text-success" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {item.available ? "Disponible" : "Loué"}
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
                    {item.specs.map((spec, i) => (
                      <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="text-2xl font-display font-bold text-foreground">{item.price}</span>
                      <span className="text-sm text-muted-foreground ml-1">{item.priceUnit}</span>
                    </div>
                    <Button variant={item.available ? "hero" : "outline"} disabled={!item.available}>
                      <Calendar className="w-4 h-4 mr-2" />
                      {item.available ? "Réserver" : "Indisponible"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalogue;

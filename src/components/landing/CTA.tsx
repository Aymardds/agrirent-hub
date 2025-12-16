import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="relative bg-card rounded-3xl border border-border overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 p-12 md:p-16 lg:p-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
                Prêt à transformer votre gestion agricole ?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Rejoignez les centaines de professionnels qui utilisent OUTILTECH
                pour optimiser leurs opérations et développer leur activité.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Créer un compte gratuit
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="xl">
                    Demander une démo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-muted-foreground">
                <a
                  href="tel:+2250777000000"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>+225 07 77 00 00 00</span>
                </a>
                <a
                  href="mailto:outiltech@grainotech.com"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>outiltech@grainotech.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

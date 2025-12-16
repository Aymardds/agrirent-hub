import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Tractor, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-md">
              <Tractor className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              OUTILTECH
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/catalogue"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Catalogue
            </Link>
            <a
              href="https://www.grainotech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1"
            >
              Grainotech
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link to="/dashboard">
                <Button variant="hero">Mon Tableau de bord</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link to="/catalogue">
                  <Button variant="hero">Voir le Catalogue</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/catalogue"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Catalogue
              </Link>
              <a
                href="https://www.grainotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2 flex items-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                Grainotech
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {session ? (
                  <Link to="/dashboard">
                    <Button variant="hero" className="w-full">
                      Mon Tableau de bord
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="w-full">
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/catalogue">
                      <Button variant="hero" className="w-full">
                        Voir le Catalogue
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

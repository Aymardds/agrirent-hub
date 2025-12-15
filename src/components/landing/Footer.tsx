import { Link } from "react-router-dom";
import { Tractor, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const links = {
    produit: [
      { name: "Catalogue", href: "/catalogue" },
      { name: "Tarifs", href: "/pricing" },
      { name: "Fonctionnalités", href: "/features" },
      { name: "Roadmap", href: "/roadmap" },
    ],
    entreprise: [
      { name: "À propos", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Carrières", href: "/careers" },
      { name: "Contact", href: "/contact" },
    ],
    ressources: [
      { name: "Documentation", href: "/docs" },
      { name: "Aide", href: "/help" },
      { name: "Tutoriels", href: "/tutorials" },
      { name: "API", href: "/api" },
    ],
    legal: [
      { name: "Confidentialité", href: "/privacy" },
      { name: "CGU", href: "/terms" },
      { name: "Mentions légales", href: "/legal" },
    ],
  };

  const socials = [
    { icon: Facebook, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Instagram, href: "#" },
  ];

  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Tractor className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">OUTILTECH</span>
            </Link>
            <p className="text-sidebar-foreground/70 mb-6 max-w-xs">
              La plateforme digitale de référence pour la location et la gestion
              de matériel agricole en Afrique de l'Ouest.
            </p>
            <div className="flex gap-3">
              {socials.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-ring transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-3">
              {links.produit.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-3">
              {links.entreprise.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Ressources</h4>
            <ul className="space-y-3">
              {links.ressources.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sidebar-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sidebar-foreground/60 text-sm">
            © 2024 OUTILTECH. Tous droits réservés.
          </p>
          <p className="text-sidebar-foreground/60 text-sm">
            Fait avec ❤️ GRAINOTECH
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

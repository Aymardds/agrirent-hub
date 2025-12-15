import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Tractor,
  ChevronLeft,
  Bell,
  Search,
  Wrench,
  ShoppingCart,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { normalizeRole, UserRole } from "@/lib/roleUtils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const DashboardLayout = ({ children, userRole: propUserRole = "super_admin" }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use the role from user metadata with normalization, fallback to prop
  const normalizedRole = normalizeRole(user?.user_metadata?.role);
  const userRole = (normalizedRole as UserRole) || propUserRole;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Debug: Log menu configuration
  useEffect(() => {
    console.log('📋 Dashboard Layout Loaded:', {
      userRole,
      menuItems: menu.length,
      currentPath: location.pathname,
      menu: menu.map(m => ({ label: m.label, href: m.href }))
    });
  }, [userRole, location.pathname]);

  const roleMenus = {
    super_admin: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
      { icon: Users, label: "Utilisateurs", href: "/dashboard/users" },
      { icon: Package, label: "Matériels", href: "/dashboard/stock" },
      { icon: Calendar, label: "Locations", href: "/dashboard/rentals" },
      { icon: Wrench, label: "Interventions", href: "/dashboard/interventions" },
      { icon: BarChart3, label: "Statistiques", href: "/dashboard/stats" },
      { icon: FileText, label: "Facturation", href: "/dashboard/invoices" },
      { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
    ],
    admin: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
      { icon: Users, label: "Utilisateurs", href: "/dashboard/users" },
      { icon: Package, label: "Matériels", href: "/dashboard/stock" },
      { icon: Calendar, label: "Locations", href: "/dashboard/rentals" },
      { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
    ],
    stock_manager: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/stock-manager" },
      { icon: Package, label: "Stock", href: "/dashboard/stock" },
      { icon: Calendar, label: "Planning", href: "/dashboard/planning" },
      { icon: Wrench, label: "Maintenance", href: "/dashboard/maintenance" },
    ],
    technician: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/technician" },
      { icon: Calendar, label: "Planning", href: "/dashboard/planning" },
      { icon: Wrench, label: "Interventions", href: "/dashboard/interventions" },
      { icon: BarChart3, label: "Statistiques", href: "/dashboard/stats" },
      { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
    ],
    client: [
      { icon: LayoutDashboard, label: "Accueil", href: "/dashboard/client" },
      { icon: ShoppingCart, label: "Catalogue", href: "/dashboard/catalog" },
      { icon: Calendar, label: "Mes locations", href: "/dashboard/my-rentals" },
      { icon: FileText, label: "Factures", href: "/dashboard/my-invoices" },
    ],
    accountant: [
      { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard/accountant" },
      { icon: FileText, label: "Facturation", href: "/dashboard/invoices" },
      { icon: BarChart3, label: "États financiers", href: "/dashboard/finances" },
      { icon: Calendar, label: "Paiements", href: "/dashboard/payments" },
    ],
  };

  const menu = roleMenus[userRole] || roleMenus.client;

  const roleLabels = {
    super_admin: "Super Admin",
    admin: "Administrateur",
    stock_manager: "Gestionnaire Stock",
    technician: " Technicien",
    client: "Client",
    accountant: "Comptabilité",
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Tractor className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold">OUTILTECH</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menu.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={index}
                to={item.href}
                onClick={(e) => {
                  console.log('🔗 Navigation Click:', {
                    from: location.pathname,
                    to: item.href,
                    label: item.label,
                    userRole: userRole
                  });
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-sidebar-border">
          {!collapsed && (
            <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email || "Utilisateur"}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabels[userRole]}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-3">Déconnexion</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", collapsed ? "ml-20" : "ml-64")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
              </button>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.user_metadata?.full_name
                    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                    : user?.email?.substring(0, 2).toUpperCase() || "UT"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

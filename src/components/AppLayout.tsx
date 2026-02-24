import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ClipboardList,
  Users,
  BarChart3,
  Box,
  PackageOpen,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Ingredientes", icon: Box },
  { to: "/dishes", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/orders", label: "Pedidos", icon: ClipboardList },
  { to: "/stock", label: "Estoque", icon: PackageOpen },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/reports", label: "Relatórios", icon: BarChart3, disabled: true },
  { to: "/profile", label: "Meu Perfil", icon: User },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const isAdmin = useAuthStore((s) => s.userAuth?.role) === "admin";

  const handleLogout = () => {
    clearTokens();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r border-border p-6 hidden md:flex flex-col">
        <div className="mb-6 flex justify-center">
          <img src="/logo.png" alt="Thaina Pty" className="h-auto max-w-36" />
        </div>
        <nav className="space-y-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                } ${l.disabled ? "cursor-not-allowed opacity-50" : ""}`
              }
              aria-disabled={l.disabled}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/management"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-2 border-dashed ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary/50 text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary"
                }`
              }
            >
              <Settings className="w-4 h-4" />
              Gerenciamento
            </NavLink>
          )}
        </nav>
        <Button
          variant="ghost"
          className="mt-auto justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex md:hidden z-50 items-center">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <l.icon className="w-5 h-5 mb-1" />
            {l.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/management"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors border-t-2 border-dashed border-primary/50 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Settings className="w-5 h-5 mb-1" />
            Gerenciamento
          </NavLink>
        )}
        <button
          type="button"
          className="flex-1 flex flex-col items-center py-3 text-xs text-muted-foreground"
          onClick={handleLogout}
          aria-label="Sair"
        >
          <LogOut className="w-5 h-5 mb-1" />
          Sair
        </button>
      </div>

      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-auto">
        {/* <LowStockBanner /> */}
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ClipboardList,
  Users,
  BarChart3,
  Box,
  PackageOpen,
} from "lucide-react";
import LowStockBanner from "./LowStockBanner";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Ingredientes", icon: Box },
  { to: "/stock", label: "Estoque", icon: PackageOpen },
  { to: "/dishes", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/orders", label: "Pedidos", icon: ClipboardList },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/reports", label: "Relatórios", icon: BarChart3, disabled: true },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r border-border p-6 hidden md:flex flex-col">
        <div className="mb-6">
          <img src="/logo.png" alt="Thaina Pty" className="w-full h-auto max-w-36" />
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
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex md:hidden z-50">
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
      </div>

      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-auto">
        {/* <LowStockBanner /> */}
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, UtensilsCrossed, ClipboardList, Users } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/dishes', label: 'Dishes', icon: UtensilsCrossed },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/clients', label: 'Clients', icon: Users },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r border-border p-6 hidden md:flex flex-col">
        <h2 className="font-display text-xl font-bold text-primary mb-8 tracking-wide">🍽️ RestaurantOS</h2>
        <nav className="space-y-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
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
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <l.icon className="w-5 h-5 mb-1" />
            {l.label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

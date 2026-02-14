import { useRestaurantStore } from '@/store/restaurantStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, UtensilsCrossed, ClipboardList, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { products, dishes, orders } = useRestaurantStore();
  const lowStock = products.filter((p) => p.quantity <= p.minStock);
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  const stats = [
    { label: 'Products', value: products.length, icon: Package, color: 'text-primary' },
    { label: 'Dishes', value: dishes.length, icon: UtensilsCrossed, color: 'text-primary' },
    { label: 'Orders', value: orders.length, icon: ClipboardList, color: 'text-primary' },
    { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? 'text-destructive' : 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Restaurant overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-destructive font-bold">{p.quantity} / {p.minStock} {p.unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Pending Orders ({pendingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="font-mono text-sm">#{o.id.slice(0, 6)}</span>
                  <span className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

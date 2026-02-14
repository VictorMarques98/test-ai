import { useState, useMemo } from 'react';
import { useRestaurantStore, checkOrderFeasibility } from '@/store/restaurantStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ShoppingCart, AlertTriangle, CheckCircle2, X, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function OrdersPage() {
  const { orders, dishes, products, clients, addOrder, confirmOrder } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ dishId: string; quantity: number }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  const addItem = () => {
    if (dishes.length === 0) return;
    setItems([...items, { dishId: dishes[0].id, quantity: 1 }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: field === 'quantity' ? Number(value) : value };
    setItems(updated);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const feasibility = useMemo(
    () => (items.length > 0 ? checkOrderFeasibility(items, dishes, products) : null),
    [items, dishes, products]
  );

  const handleSubmit = () => {
    if (items.length === 0) return;
    addOrder(items, selectedClientId || undefined);
    setItems([]);
    setSelectedClientId('');
    setOpen(false);
  };

  const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || 'Unknown';
  const getClientName = (id?: string) => (id ? clients.find((c) => c.id === id)?.name || 'Unknown' : '—');

  const statusColor = (s: string) => {
    if (s === 'pending') return 'secondary';
    if (s === 'confirmed') return 'default';
    return 'outline';
  };

  const sortedOrders = [...orders].reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Track customer orders & stock impact</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setItems([]); setSelectedClientId(''); } }}>
          <DialogTrigger asChild>
            <Button disabled={dishes.length === 0}>
              <Plus className="w-4 h-4 mr-2" />{dishes.length === 0 ? 'Add dishes first' : 'New Order'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Order</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              {clients.length > 0 && (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Select a client (optional)" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Items</p>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Add Dish</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={item.dishId} onValueChange={(v) => updateItem(idx, 'dishId', v)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dishes.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-20" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>

              {feasibility && feasibility.shortages.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4" /> Inventory Shortage
                  </div>
                  {feasibility.shortages.map((s, i) => (
                    <p key={i} className="text-xs text-destructive/80">
                      {s.product.name}: need {s.needed} {s.product.unit}, only {s.available} available
                    </p>
                  ))}
                </div>
              )}

              {feasibility && feasibility.shortages.length === 0 && items.length > 0 && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-success">All ingredients available</span>
                </div>
              )}

              <Button className="w-full" onClick={handleSubmit}>Place Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sortedOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedOrders.map((o) => (
            <Card key={o.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">#{o.id.slice(0, 6)}</span>
                    <span className="text-sm font-medium">{getClientName(o.clientId)}</span>
                    <Badge variant={statusColor(o.status)}>{o.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</span>
                    {o.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => confirmOrder(o.id)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />Confirm
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {o.items.map((item, i) => (
                    <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {getDishName(item.dishId)} ×{item.quantity}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

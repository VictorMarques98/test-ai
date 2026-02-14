import { useState, useMemo } from 'react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Pencil, Users, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ClientsPage() {
  const { clients, orders, dishes, addClient, updateClient, deleteClient } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [search, setSearch] = useState('');

  const resetForm = () => { setForm({ name: '', phone: '', email: '' }); setEditId(null); };

  const handleSubmit = () => {
    const data = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() };
    if (!data.name) return;
    if (editId) { updateClient(editId, data); } else { addClient(data); }
    resetForm();
    setOpen(false);
  };

  const startEdit = (c: typeof clients[0]) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone, email: c.email });
    setOpen(true);
  };

  const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || 'Unknown';

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const getClientOrders = (clientId: string) =>
    orders.filter((o) => o.clientId === clientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage clients & view their orders</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Client' : 'New Client'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Client name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Button className="w-full" onClick={handleSubmit}>{editId ? 'Update' : 'Add Client'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, phone or email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredClients.map((c) => {
          const clientOrders = getClientOrders(c.id);
          return (
            <Card key={c.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.phone && <span className="mr-4">📞 {c.phone}</span>}
                      {c.email && <span>✉️ {c.email}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteClient(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {clientOrders.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">#{o.id.slice(0, 6)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {o.items.map((item, i) => (
                                  <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                    {getDishName(item.dishId)} ×{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell><Badge variant={o.status === 'pending' ? 'secondary' : o.status === 'confirmed' ? 'default' : 'outline'}>{o.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No orders yet</p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

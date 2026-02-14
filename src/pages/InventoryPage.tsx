import { useState } from 'react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Pencil, Package, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', minStock: '' });

  const resetForm = () => { setForm({ name: '', quantity: '', unit: '', minStock: '' }); setEditId(null); };

  const handleSubmit = () => {
    const data = { name: form.name.trim(), quantity: Number(form.quantity), unit: form.unit.trim(), minStock: Number(form.minStock) };
    if (!data.name || isNaN(data.quantity)) return;
    if (editId) { updateProduct(editId, data); } else { addProduct(data); }
    resetForm();
    setOpen(false);
  };

  const startEdit = (p: typeof products[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, quantity: String(p.quantity), unit: p.unit, minStock: String(p.minStock) });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage your product stock</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Product' : 'New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                <Input placeholder="Unit (kg, L, pcs)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <Input type="number" placeholder="Min stock alert" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              <Button className="w-full" onClick={handleSubmit}>{editId ? 'Update' : 'Add Product'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products yet. Add your first product to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const isLow = p.quantity <= p.minStock;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold flex items-center gap-2">
                      {isLow && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                      {p.name}
                    </TableCell>
                    <TableCell className={isLow ? 'text-destructive font-bold' : ''}>{p.quantity}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>{p.minStock}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

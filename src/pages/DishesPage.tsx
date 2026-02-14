import { useState } from 'react';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Pencil, UtensilsCrossed, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DishIngredient } from '@/types/restaurant';

export default function DishesPage() {
  const { dishes, products, addDish, updateDish, deleteDish } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState<DishIngredient[]>([]);

  const resetForm = () => { setName(''); setPrice(''); setIngredients([]); setEditId(null); };

  const handleSubmit = () => {
    if (!name.trim() || ingredients.length === 0) return;
    const data = { name: name.trim(), price: Number(price) || 0, ingredients };
    if (editId) { updateDish(editId, data); } else { addDish(data); }
    resetForm();
    setOpen(false);
  };

  const startEdit = (d: typeof dishes[0]) => {
    setEditId(d.id);
    setName(d.name);
    setPrice(String(d.price));
    setIngredients([...d.ingredients]);
    setOpen(true);
  };

  const addIngredient = () => {
    if (products.length === 0) return;
    setIngredients([...ingredients, { productId: products[0].id, quantity: 1 }]);
  };

  const updateIngredient = (idx: number, field: keyof DishIngredient, value: string | number) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: field === 'quantity' ? Number(value) : value };
    setIngredients(updated);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || 'Unknown';
  const getProductUnit = (id: string) => products.find((p) => p.id === id)?.unit || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dishes</h1>
          <p className="text-muted-foreground mt-1">Create dishes with ingredient recipes</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button disabled={products.length === 0}>
              <Plus className="w-4 h-4 mr-2" />{products.length === 0 ? 'Add products first' : 'New Dish'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Dish' : 'New Dish'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Ingredients</p>
                  <Button variant="outline" size="sm" onClick={addIngredient}><Plus className="w-3 h-3 mr-1" />Add</Button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={ing.productId} onValueChange={(v) => updateIngredient(idx, 'productId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" className="w-20" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} />
                      <span className="text-xs text-muted-foreground w-8">{getProductUnit(ing.productId)}</span>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeIngredient(idx)}><X className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit}>{editId ? 'Update' : 'Create Dish'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {dishes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No dishes yet. Create your first dish.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {dishes.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg">{d.name}</p>
                    <p className="text-primary font-bold">${d.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(d)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDish(d.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {getProductName(ing.productId)}: {ing.quantity} {getProductUnit(ing.productId)}
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

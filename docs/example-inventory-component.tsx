import { useEffect, useState } from 'react';
import { useRestaurantStore } from '@/store/restaurantStoreApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Example component showing how to use the new API-based restaurant store
 * This component manages inventory items with full CRUD operations
 */
export default function ExampleInventoryComponent() {
  // Get store state and actions
  const {
    items,
    stock,
    isLoading,
    error,
    fetchItems,
    fetchStock,
    createItem,
    updateItem,
    deleteItem,
    createStock,
    updateStock,
    clearError,
  } = useRestaurantStore();

  // Local state for forms
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_type: 'grams' as 'grams' | 'unit',
  });

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchItems(), fetchStock()]);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, [fetchItems, fetchStock]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle create item
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = await createItem({
        name: formData.name,
        description: formData.description || null,
        unit_type: formData.unit_type,
      });

      // Create initial stock for the new item
      await createStock({
        itemId: newItem.id,
        quantity: 0,
      });

      // Reset form and close dialog
      setFormData({ name: '', description: '', unit_type: 'grams' });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  // Handle update item
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, {
        name: formData.name,
        description: formData.description || null,
        unit_type: formData.unit_type,
      });

      // Close dialog and reset
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', unit_type: 'grams' });
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  // Handle delete item
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItem(id);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Open edit dialog
  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      unit_type: item.unit_type,
    });
    setIsEditDialogOpen(true);
  };

  // Handle stock update
  const handleUpdateStock = async (stockId: string, currentQuantity: number) => {
    const newQuantity = prompt('Enter new quantity:', currentQuantity.toString());
    if (!newQuantity) return;

    try {
      await updateStock(stockId, {
        quantity: parseFloat(newQuantity),
      });
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  // Get stock for an item
  const getItemStock = (itemId: string) => {
    return stock.find((s) => s.item_id === itemId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage items and stock levels</p>
        </div>

        {/* Create Item Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
                <DialogDescription>Add a new item to your inventory</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit_type">Unit Type *</Label>
                  <Select
                    value={formData.unit_type}
                    onValueChange={(value: 'grams' | 'unit') =>
                      setFormData({ ...formData, unit_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grams">Grams</SelectItem>
                      <SelectItem value="unit">Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>All inventory items with stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No items yet. Create your first item!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const itemStock = getItemStock(item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                          {item.unit_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {itemStock ? (
                          <button
                            onClick={() => handleUpdateStock(itemStock.id, itemStock.quantity)}
                            className="text-blue-600 hover:underline"
                          >
                            {itemStock.quantity}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{itemStock?.reserved_quantity || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Update item details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unit_type">Unit Type *</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value: 'grams' | 'unit') =>
                    setFormData({ ...formData, unit_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

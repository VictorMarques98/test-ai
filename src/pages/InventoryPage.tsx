import { useState } from "react";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Pencil, Package, AlertTriangle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InventoryPage() {
	const { products, addProduct, updateProduct, deleteProduct, orders, dishes } = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ name: "", quantity: "", unit: "", minStock: "" });

	const resetForm = () => {
		setForm({ name: "", quantity: "", unit: "", minStock: "" });
		setEditId(null);
	};

	const handleSubmit = () => {
		const data = {
			name: form.name.trim(),
			quantity: Number(form.quantity),
			unit: form.unit.trim(),
			minStock: Number(form.minStock),
		};
		if (!data.name || isNaN(data.quantity)) return;
		if (editId) {
			updateProduct(editId, data);
		} else {
			addProduct(data);
		}
		resetForm();
		setOpen(false);
	};

	const startEdit = (p: (typeof products)[0]) => {
		setEditId(p.id);
		setForm({ name: p.name, quantity: String(p.quantity), unit: p.unit, minStock: String(p.minStock) });
		setOpen(true);
	};

	const calculateCurrentQuantity = (productId: string) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return 0;

		let usedQuantity = 0;
		// Count both pending and confirmed orders since they both reserve inventory
		const activeOrders = orders.filter((o) => o.status === "confirmed" || o.status === "pending");

		for (const order of activeOrders) {
			for (const item of order.items) {
				const dish = dishes.find((d) => d.id === item.dishId);
				if (dish) {
					const ingredient = dish.ingredients.find((ing) => ing.productId === productId);
					if (ingredient) {
						usedQuantity += ingredient.quantity * item.quantity;
					}
				}
			}
		}

		return product.quantity - usedQuantity;
	};

	const lowStockProducts = products.filter((p) => calculateCurrentQuantity(p.id) <= p.minStock);
	const negativeStockProducts = products.filter((p) => calculateCurrentQuantity(p.id) < 0);
	const totalProducts = products.length;

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<Package className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Inventory Management</h1>
							<p className="text-slate-300 mt-1">Track and manage your product stock levels</p>
						</div>
					</div>
					<Dialog
						open={open}
						onOpenChange={(v) => {
							setOpen(v);
							if (!v) resetForm();
						}}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg">
								<Plus className="w-4 h-4 mr-2" />
								Add Product
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Edit Product" : "New Product"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<Input
									placeholder="Product name"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
								<div className="grid grid-cols-2 gap-3">
									<Input
										type="number"
										placeholder="Quantity"
										value={form.quantity}
										onChange={(e) => setForm({ ...form, quantity: e.target.value })}
									/>
									<Input
										placeholder="Unit (kg, L, pcs)"
										value={form.unit}
										onChange={(e) => setForm({ ...form, unit: e.target.value })}
									/>
								</div>
								<Input
									type="number"
									placeholder="Min stock alert"
									value={form.minStock}
									onChange={(e) => setForm({ ...form, minStock: e.target.value })}
								/>
								<Button className="w-full" onClick={handleSubmit}>
									{editId ? "Update" : "Add Product"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Statistics Section */}
			{products.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">Total Products</p>
									<p className="text-3xl font-bold mt-2">{totalProducts}</p>
								</div>
								<div className="p-3 bg-primary/10 rounded-full">
									<Package className="w-6 h-6 text-primary" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
									<p className="text-3xl font-bold mt-2 text-amber-600 dark:text-amber-500">
										{lowStockProducts.length}
									</p>
								</div>
								<div className="p-3 bg-amber-500/10 rounded-full">
									<TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-500" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-muted-foreground">Critical Stock</p>
									<p className="text-3xl font-bold mt-2 text-destructive">
										{negativeStockProducts.length}
									</p>
								</div>
								<div className="p-3 bg-destructive/10 rounded-full">
									<AlertTriangle className="w-6 h-6 text-destructive" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Table Section */}
			{products.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Package className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">No products yet. Add your first product to get started.</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="font-bold">Product</TableHead>
									<TableHead className="font-bold">Stock Quantity</TableHead>
									<TableHead className="font-bold">Current Qty</TableHead>
									<TableHead className="font-bold">Unit</TableHead>
									<TableHead className="font-bold">Min Stock</TableHead>
									<TableHead className="text-right font-bold">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{products.map((p) => {
									const currentQty = calculateCurrentQuantity(p.id);
									const isLow = currentQty <= p.minStock;
									const isNegative = currentQty < 0;
									return (
										<TableRow key={p.id} className="hover:bg-muted/30">
											<TableCell className="font-semibold">
												<div className="flex items-center gap-2">
													{isLow && (
														<AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
													)}
													{p.name}
												</div>
											</TableCell>
											<TableCell className="font-medium">{p.quantity}</TableCell>
											<TableCell>
												<span
													className={
														isNegative
															? "px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold text-sm"
															: isLow
																? "px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold text-sm"
																: "px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 font-semibold text-sm"
													}>
													{currentQty.toFixed(2)}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground">{p.unit}</TableCell>
											<TableCell className="text-muted-foreground">{p.minStock}</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-primary/10 hover:text-primary"
														onClick={() => startEdit(p)}>
														<Pencil className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-destructive/10 hover:text-destructive"
														onClick={() => deleteProduct(p.id)}>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

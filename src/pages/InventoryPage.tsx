import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRestaurantStore } from "@/store/restaurantStore";
import { AlertTriangle, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function InventoryPage() {
	const { products, addProduct, updateProduct, deleteProduct, orders, dishes } = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ name: "", quantity: "", unit: "", minStock: "", buyPrice: "" });

	const resetForm = () => {
		setForm({ name: "", quantity: "", unit: "", minStock: "", buyPrice: "" });
		setEditId(null);
	};

	const handleSubmit = () => {
		const data = {
			name: form.name.trim(),
			quantity: Number(form.quantity),
			unit: form.unit.trim(),
			minStock: Number(form.minStock),
			...(form.buyPrice && !isNaN(Number(form.buyPrice)) ? { buyPrice: Number(form.buyPrice) } : {}),
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
		setForm({
			name: p.name,
			quantity: String(p.quantity),
			unit: p.unit,
			minStock: String(p.minStock),
			buyPrice: p.buyPrice ? String(p.buyPrice) : "",
		});
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
							<h1 className="text-3xl font-bold text-white">Controle de estoque</h1>
							<p className="text-slate-300 mt-1">Gerencie seus ingredientes</p>
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
								Adicionar produto
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Produto</label>
									<Input
										placeholder="Nome do produto"
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Quantidade</label>
										<Input
											type="number"
											placeholder="Quantidade"
											value={form.quantity}
											onChange={(e) => setForm({ ...form, quantity: e.target.value })}
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Unidade</label>
										<Input
											placeholder="kg, L, un"
											value={form.unit}
											onChange={(e) => setForm({ ...form, unit: e.target.value })}
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Estoque Mínimo</label>
									<Input
										type="number"
										placeholder="Alerta de estoque mínimo"
										value={form.minStock}
										onChange={(e) => setForm({ ...form, minStock: e.target.value })}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Preço de Compra (opcional)</label>
									<Input
										type="number"
										step="0.01"
										placeholder="0.00"
										value={form.buyPrice}
										onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
									/>
								</div>
								<Button className="w-full" onClick={handleSubmit}>
									{editId ? "Atualizar" : "Adicionar Produto"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Table Section */}
			{products.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Package className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							Nenhum produto ainda. Adicione seu primeiro produto para começar.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="font-bold">Produto</TableHead>
									<TableHead className="font-bold">Qtd. Estoque</TableHead>
									<TableHead className="font-bold">Qtd. Atual</TableHead>
									<TableHead className="font-bold">Estoque Mínimo</TableHead>
									<TableHead className="font-bold">Preço de Compra</TableHead>
									<TableHead className="text-right font-bold">Ações</TableHead>
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
											<TableCell className="font-medium">
												{p.quantity} {p.unit}
											</TableCell>
											<TableCell>
												<span
													className={
														isNegative
															? "px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold text-sm"
															: isLow
																? "px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold text-sm"
																: "px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 font-semibold text-sm"
													}>
													{currentQty.toFixed(2)} {p.unit}
												</span>
											</TableCell>{" "}
											<TableCell className="text-muted-foreground">
												{p.minStock} {p.unit}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{p.buyPrice ? (
													<span className="font-semibold text-green-600 dark:text-green-500">
														${p.buyPrice.toFixed(2)}
													</span>
												) : (
													<span className="text-muted-foreground/50">—</span>
												)}
											</TableCell>{" "}
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

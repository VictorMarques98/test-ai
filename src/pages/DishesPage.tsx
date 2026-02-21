import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Pencil, UtensilsCrossed, X, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductItemDto } from "@/types/api";
import { toast } from "sonner";

export default function DishesPage() {
	const location = useLocation();
	const { 
		products, 
		items,
		isLoading,
		error,
		fetchProducts, 
		fetchItems,
		createProduct, 
		updateProduct, 
		deleteProduct,
		clearError 
	} = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [buyPrice, setBuyPrice] = useState("");
	const [productItems, setProductItems] = useState<ProductItemDto[]>([]);

	// Fetch data on mount
	useEffect(() => {
		Promise.all([
			fetchProducts(),
			fetchItems()
		]).catch(err => {
			console.error('Failed to load data:', err);
		});
	}, [fetchProducts, fetchItems]);

	// Handle opening modal from navigation
	useEffect(() => {
		const state = location.state as { openModal?: boolean } | null;
		if (state?.openModal) {
			setOpen(true);
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	// Auto-clear errors after 5 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				clearError();
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const resetForm = () => {
		setName("");
		setDescription("");
		setPrice("");
		setBuyPrice("");
		setProductItems([]);
		setEditId(null);
	};

	const handleSubmit = async () => {
		if (!name.trim() || productItems.length === 0) {
			toast.error('Por favor, preencha o nome e adicione pelo menos um ingrediente');
			return;
		}

		try {
			const data = {
				name: name.trim(),
				description: description.trim() || undefined,
				price: price ? Number(price) : undefined,
				buyPrice: buyPrice ? Number(buyPrice) : undefined,
				items: productItems,
			};

			if (editId) {
				await updateProduct(editId, data);
				toast.success('Prato atualizado com sucesso!');
			} else {
				await createProduct(data);
				toast.success('Prato criado com sucesso!');
			}
			resetForm();
			setOpen(false);
		} catch (error: any) {
			toast.error(error.message || 'Falha ao salvar prato');
		}
	};

	const startEdit = (product: (typeof products)[0]) => {
		setEditId(product.id);
		setName(product.name);
		setDescription(product.description || "");
		setPrice(product.price ? String(product.price) : "");
		setBuyPrice(product.buyPrice ? String(product.buyPrice) : "");
		
		// Map product_items to ProductItemDto format
		const mappedItems: ProductItemDto[] = (product.product_items || []).map(pi => ({
			itemId: pi.item_id,
			quantity: pi.quantity
		}));
		setProductItems(mappedItems);
		setOpen(true);
	};

	const addIngredient = () => {
		if (items.length === 0) return;
		setProductItems([
			...productItems,
			{ itemId: items[0].id, quantity: 1 },
		]);
	};

	const updateIngredient = (idx: number, field: keyof ProductItemDto, value: string | number) => {
		const updated = [...productItems];
		updated[idx] = { ...updated[idx], [field]: field === "quantity" ? Number(value) : value };
		setProductItems(updated);
	};

	const removeIngredient = (idx: number) => {
		setProductItems(productItems.filter((_, i) => i !== idx));
	};

	const getItemName = (id: string) => items.find((i) => i.id === id)?.name || "Desconhecido";
	const getItemUnit = (id: string) => {
		const item = items.find((i) => i.id === id);
		if (!item) return "";
		
		const unitMap = {
			grams: 'g',
			kg: 'kg',
			ml: 'ml',
			liters: 'L',
			unit: 'un'
		};
		
		return unitMap[item.unit_type] || "";
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<UtensilsCrossed className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Cardapio</h1>
							<p className="text-slate-300 mt-1">Visualize todas suas receitas</p>
						</div>
					</div>
					<Dialog
						open={open}
						onOpenChange={(v) => {
							setOpen(v);
							if (!v) resetForm();
						}}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg" disabled={items.length === 0 || isLoading}>
								<Plus className="w-4 h-4 mr-2" />
								{items.length === 0 ? "Adicione ingredientes primeiro" : "Novo Prato"}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Prato" : "Novo Prato"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2 overflow-y-auto px-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Prato *</label>
									<Input
										placeholder="Nome do prato"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Descrição</label>
									<Input
										placeholder="Descrição do prato (opcional)"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Preço de Venda</label>
										<Input
											type="number"
											placeholder="$"
											step="0.01"
											value={price}
											onChange={(e) => setPrice(e.target.value)}
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Custo</label>
										<Input
											type="number"
											placeholder="$"
											step="0.01"
											value={buyPrice}
											onChange={(e) => setBuyPrice(e.target.value)}
										/>
									</div>
								</div>
								<div>
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm font-medium">Ingredientes *</p>
										<Button variant="outline" size="sm" onClick={addIngredient}>
											<Plus className="w-3 h-3 mr-1" />
											Adicionar
										</Button>
									</div>
									<div className="space-y-3">
										{productItems.map((item, idx) => (
											<div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/30">
												<Select
													value={item.itemId}
													onValueChange={(v) => updateIngredient(idx, "itemId", v)}>
													<SelectTrigger className="flex-1">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{items.map((i) => (
															<SelectItem key={i.id} value={i.id}>
																{i.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<div className="flex items-center gap-1 min-w-[120px]">
													<Input
														type="number"
														step="0.1"
														className="text-sm w-20"
														value={item.quantity}
														onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
													/>
													<span className="text-xs text-muted-foreground min-w-[30px]">
														{getItemUnit(item.itemId)}
													</span>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="shrink-0"
													onClick={() => removeIngredient(idx)}>
													<X className="w-4 h-4" />
												</Button>
											</div>
										))}
									</div>
								</div>
								<Button
									className="w-full"
									onClick={handleSubmit}
									disabled={!name.trim() || productItems.length === 0 || isLoading}>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											{editId ? "Atualizando..." : "Criando..."}
										</>
									) : (
										editId ? "Atualizar Prato" : "Criar Prato"
									)}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{isLoading && products.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
						<p className="text-muted-foreground">Carregando pratos...</p>
					</CardContent>
				</Card>
			) : products.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Nenhum prato ainda. Crie seu primeiro prato.</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{products.map((product) => (
						<Card key={product.id} className="overflow-hidden flex flex-col">
							<CardContent className="p-0 flex flex-col h-full">
								<div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b flex-shrink-0">
									<div className="flex items-start justify-between mb-2">
										<div className="flex-1 min-w-0">
											<p className="font-bold text-lg truncate">{product.name}</p>
											{product.description && (
												<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
													{product.description}
												</p>
											)}
											<div className="flex gap-3 mt-2 text-sm">
												{product.price && (
													<span className="text-muted-foreground">
														Venda:{" "}
														<span className="font-bold text-primary">
															${Number(product.price).toFixed(2)}
														</span>
													</span>
												)}
												{product.buyPrice && (
													<span className="text-muted-foreground">
														Custo:{" "}
														<span className="font-semibold text-foreground">
															${Number(product.buyPrice).toFixed(2)}
														</span>
													</span>
												)}
											</div>
										</div>
										<div className="flex gap-1 ml-2">
											<Button variant="ghost" size="icon" onClick={() => startEdit(product)}>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={async () => {
													if (confirm('Tem certeza que deseja excluir este prato?')) {
														try {
															await deleteProduct(product.id);
															toast.success('Prato excluído com sucesso!');
														} catch (error: any) {
															toast.error(error.message || 'Falha ao excluir prato');
														}
													}
												}}
												className="hover:bg-destructive/10 hover:text-destructive">
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</div>
								</div>
								<div className="p-4 flex-1 overflow-auto">
									<p className="text-xs font-medium text-muted-foreground mb-2 uppercase">
										Ingredientes
									</p>
									<div className="space-y-2">
										{(product.product_items || []).length === 0 ? (
											<p className="text-xs text-muted-foreground italic">
												Nenhum ingrediente
											</p>
										) : (
											(product.product_items || []).map((pi, i) => (
												<div key={i} className="text-xs bg-secondary/50 p-2 rounded">
													<div className="font-semibold">
														{pi.item?.name || getItemName(pi.item_id)}
													</div>
													<div className="text-muted-foreground">
														{pi.quantity} {getItemUnit(pi.item_id)}
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

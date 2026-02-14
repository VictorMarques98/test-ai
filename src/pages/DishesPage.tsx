import { useState } from "react";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Pencil, UtensilsCrossed, X, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DishIngredient } from "@/types/restaurant";

export default function DishesPage() {
	const { dishes, products, addDish, updateDish, deleteDish } = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [priceSmall, setPriceSmall] = useState("");
	const [priceMedium, setPriceMedium] = useState("");
	const [priceLarge, setPriceLarge] = useState("");
	const [ingredients, setIngredients] = useState<DishIngredient[]>([]);

	const resetForm = () => {
		setName("");
		setPriceSmall("");
		setPriceMedium("");
		setPriceLarge("");
		setIngredients([]);
		setEditId(null);
	};

	const handleSubmit = () => {
		if (!name.trim() || ingredients.length === 0) return;
		const data = {
			name: name.trim(),
			priceSmall: Number(priceSmall) || 0,
			priceMedium: Number(priceMedium) || 0,
			priceLarge: Number(priceLarge) || 0,
			ingredients,
		};
		if (editId) {
			updateDish(editId, data);
		} else {
			addDish(data);
		}
		resetForm();
		setOpen(false);
	};

	const startEdit = (d: (typeof dishes)[0]) => {
		setEditId(d.id);
		setName(d.name);
		setPriceSmall(String(d.priceSmall));
		setPriceMedium(String(d.priceMedium));
		setPriceLarge(String(d.priceLarge));
		setIngredients([...d.ingredients]);
		setOpen(true);
	};

	const addIngredient = () => {
		if (products.length === 0) return;
		setIngredients([...ingredients, { productId: products[0].id, quantity: 1 }]);
	};

	const updateIngredient = (idx: number, field: keyof DishIngredient, value: string | number) => {
		const updated = [...ingredients];
		updated[idx] = { ...updated[idx], [field]: field === "quantity" ? Number(value) : value };
		setIngredients(updated);
	};

	const removeIngredient = (idx: number) => {
		setIngredients(ingredients.filter((_, i) => i !== idx));
	};

	const getProductName = (id: string) => products.find((p) => p.id === id)?.name || "Desconhecido";
	const getProductUnit = (id: string) => products.find((p) => p.id === id)?.unit || "";

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
							<Button size="lg" className="shadow-lg" disabled={products.length === 0}>
								<Plus className="w-4 h-4 mr-2" />
								{products.length === 0 ? "Adicione produtos primeiro" : "Novo Prato"}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Prato" : "Novo Prato"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Prato</label>
									<Input
										placeholder="Nome do prato"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Preços por Tamanho</label>
									<div className="grid grid-cols-3 gap-2">
										<div className="space-y-1.5">
											<label className="text-xs font-medium text-muted-foreground">Pequeno</label>
											<Input
												type="number"
												placeholder="$"
												value={priceSmall}
												onChange={(e) => setPriceSmall(e.target.value)}
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-xs font-medium text-muted-foreground">Medio</label>
											<Input
												type="number"
												placeholder="$"
												value={priceMedium}
												onChange={(e) => setPriceMedium(e.target.value)}
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-xs font-medium text-muted-foreground">Grande</label>
											<Input
												type="number"
												placeholder="$"
												value={priceLarge}
												onChange={(e) => setPriceLarge(e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div>
									<div className="flex items-center justify-between mb-2">
										<p className="text-sm font-medium">Ingredientes</p>
										<Button variant="outline" size="sm" onClick={addIngredient}>
											<Plus className="w-3 h-3 mr-1" />
											Adicionar
										</Button>
									</div>
									<div className="space-y-2">
										{ingredients.map((ing, idx) => (
											<div key={idx} className="flex items-center gap-2">
												<Select
													value={ing.productId}
													onValueChange={(v) => updateIngredient(idx, "productId", v)}>
													<SelectTrigger className="flex-1">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{products.map((p) => (
															<SelectItem key={p.id} value={p.id}>
																{p.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<Input
													type="number"
													className="w-20"
													value={ing.quantity}
													onChange={(e) => updateIngredient(idx, "quantity", e.target.value)}
												/>
												<span className="text-xs text-muted-foreground w-8">
													{getProductUnit(ing.productId)}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="shrink-0"
													onClick={() => removeIngredient(idx)}>
													<X className="w-3 h-3" />
												</Button>
											</div>
										))}
									</div>
								</div>
								{(!priceSmall || !priceMedium || !priceLarge) && (
									<Alert
										variant="destructive"
										className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
										<div className="flex items-start gap-3">
											<AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
											<div className="flex-1">
												<AlertDescription className="text-amber-800 dark:text-amber-300 font-medium">
													Todos os campos de preço são obrigatórios
												</AlertDescription>
												<p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
													Por favor, insira um preço para os tamanhos Pequeno, Médio e Grande
													para continuar.
												</p>
											</div>
										</div>
									</Alert>
								)}
								<Button
									className="w-full"
									onClick={handleSubmit}
									disabled={
										!name.trim() ||
										ingredients.length === 0 ||
										!priceSmall ||
										!priceMedium ||
										!priceLarge
									}>
									{editId ? "Atualizar" : "Criar Prato"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{dishes.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">Nenhum prato ainda. Crie seu primeiro prato.</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{dishes.map((d) => (
						<Card key={d.id} className="overflow-hidden flex flex-col">
							<CardContent className="p-0 flex flex-col h-full">
								<div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b flex-shrink-0">
									<div className="flex items-start justify-between mb-2">
										<div className="flex-1 min-w-0">
											<p className="font-bold text-lg truncate">{d.name}</p>
											<div className="flex gap-2 mt-1 text-sm">
												<span className="text-muted-foreground">
													P:{" "}
													<span className="font-bold text-primary">
														${d.priceSmall.toFixed(2)}
													</span>
												</span>
												<span className="text-muted-foreground">
													M:{" "}
													<span className="font-bold text-primary">
														${d.priceMedium.toFixed(2)}
													</span>
												</span>
												<span className="text-muted-foreground">
													G:{" "}
													<span className="font-bold text-primary">
														${d.priceLarge.toFixed(2)}
													</span>
												</span>
											</div>
										</div>
										<div className="flex gap-1 ml-2">
											<Button variant="ghost" size="icon" onClick={() => startEdit(d)}>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => deleteDish(d.id)}
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
									<div className="flex flex-wrap gap-1.5">
										{d.ingredients.map((ing, i) => (
											<span
												key={i}
												className="text-xs bg-secondary px-2 py-1 rounded-full whitespace-nowrap">
												{getProductName(ing.productId)}: {ing.quantity}{" "}
												{getProductUnit(ing.productId)}
											</span>
										))}
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

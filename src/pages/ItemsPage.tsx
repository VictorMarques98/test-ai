import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
	Package, 
	Plus, 
	Pencil, 
	Trash2, 
	Loader2, 
	Search, 
	Filter, 
	XCircle,
	ChevronDown,
	ChevronRight,
	AlertCircle,
	Box
} from "lucide-react";
import type { UnitType } from "@/types/api";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

// Helper function to get unit display information
const getUnitDisplay = (unitType: UnitType) => {
	const displays = {
		grams: { label: 'Gramas', abbr: 'g', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-800' },
		kg: { label: 'Quilogramas', abbr: 'kg', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-200 dark:border-indigo-800' },
		ml: { label: 'Mililitros', abbr: 'ml', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 border-cyan-200 dark:border-cyan-800' },
		liters: { label: 'Litros', abbr: 'L', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-500 border-teal-200 dark:border-teal-800' },
		unit: { label: 'Unidade', abbr: 'un', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-200 dark:border-purple-800' }
	};
	return displays[unitType];
};

type ItemFormValues = {
	name: string;
	description: string;
	unit_type: UnitType | "";
	quantity: string;
	purchase_price: string;
	alert_quantity: string;
};

const ITEM_DEFAULT_VALUES: ItemFormValues = {
	name: "",
	description: "",
	unit_type: "",
	quantity: "",
	purchase_price: "",
	alert_quantity: "",
};

export default function ItemsPage() {
	const location = useLocation();
	const { 
		items,
		isLoading, 
		error, 
		fetchItems,
		createItem, 
		updateItem, 
		deleteItem,
		createStock,
		fetchStock,
		clearError 
	} = useRestaurantStore();
	
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

	const form = useForm<ItemFormValues>({ defaultValues: ITEM_DEFAULT_VALUES });
	const { formState, getValues, reset } = form;
	const isDirty = formState.isDirty;

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filterSearch, setFilterSearch] = useState("");
	const [filterUnitType, setFilterUnitType] = useState<string>("all");

	// Fetch items on mount
	useEffect(() => {
		fetchItems().catch(err => {
			console.error('Failed to load items:', err);
		});
	}, [fetchItems]);

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
		reset(ITEM_DEFAULT_VALUES);
		setEditId(null);
	};

	const handleSubmit = async () => {
		const f = getValues();
		if (!f.name.trim() || !f.unit_type) {
			showErrorToast('Por favor, preencha os campos obrigatórios');
			return;
		}
		if (!editId && !f.quantity) {
			showErrorToast('Por favor, informe a quantidade inicial');
			return;
		}
		const quantity = f.quantity ? parseFloat(f.quantity) : null;
		const alertQty = f.alert_quantity ? parseFloat(f.alert_quantity) : null;
		if (!editId && (quantity === null || isNaN(quantity) || quantity < 0.01)) {
			showErrorToast('Quantidade deve ser maior que 0');
			return;
		}
		if (alertQty !== null && (isNaN(alertQty) || alertQty < 0)) {
			showErrorToast('Quantidade de alerta inválida');
			return;
		}
		try {
			const itemData = {
				name: f.name.trim(),
				unit_type: f.unit_type,
				description: f.description.trim() || undefined,
			};
			if (editId) {
				await updateItem(editId, itemData);
				showSuccessToast('Ingrediente atualizado com sucesso!');
			} else {
				const newItem = await createItem(itemData);
				if (quantity !== null) {
					const purchasePrice = f.purchase_price ? parseFloat(f.purchase_price) : 0;
					await createStock({
						itemId: newItem.id,
						quantity,
						purchase_price: purchasePrice,
						alert_quantity: alertQty
					});
				}
				showSuccessToast('Ingrediente criado com sucesso!');
			}
			resetForm();
			setOpen(false);
			await Promise.all([fetchItems(), fetchStock()]);
		} catch (err: unknown) {
			console.error('Failed to save item:', err);
			showErrorToast((err as Error)?.message || 'Erro ao salvar item');
		}
	};

	const startEdit = (item: (typeof items)[0]) => {
		setEditId(item.id);
		reset({
			name: item.name,
			description: item.description || "",
			unit_type: item.unit_type,
			quantity: "",
			purchase_price: "",
			alert_quantity: "",
		});
		setOpen(true);
	};

	const handleConfirmDeleteItem = async (id: string) => {
		try {
			await deleteItem(id);
			showSuccessToast('Ingrediente excluído com sucesso!');
			await fetchItems();
		} catch (err: unknown) {
			console.error('Failed to delete item:', err);
			showErrorToast((err as Error)?.message || 'Erro ao excluir item');
		}
	};

	// Apply filters
	const filteredItems = useMemo(() => {
		return items.filter((item) => {
			// Search filter
			if (filterSearch) {
				const searchLower = filterSearch.toLowerCase();
				const matchName = item.name.toLowerCase().includes(searchLower);
				const matchDescription = item.description?.toLowerCase().includes(searchLower);
				if (!matchName && !matchDescription) return false;
			}

			// Unit type filter
			if (filterUnitType !== "all" && item.unit_type !== filterUnitType) return false;

			return true;
		});
	}, [items, filterSearch, filterUnitType]);

	const hasActiveFilters = filterSearch !== "" || filterUnitType !== "all";

	const clearFilters = () => {
		setFilterSearch("");
		setFilterUnitType("all");
	};

	const handleCloseItemDialog = (v: boolean) => {
		if (!v) {
			if (isDirty) setConfirmDiscardOpen(true);
			else {
				setOpen(false);
				resetForm();
			}
		} else {
			setOpen(v);
			if (!editId) reset(ITEM_DEFAULT_VALUES);
		}
	};

	const handleConfirmDiscardItem = () => {
		setOpen(false);
		resetForm();
		setConfirmDiscardOpen(false);
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<Box className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Controle de ingredientes</h1>
							<p className="text-slate-300 mt-1">
								Gerencie os ingredientes básicos usados em seus pratos.
							</p>
						</div>
					</div>
					<ConfirmDiscardDialog
						open={confirmDiscardOpen}
						onOpenChange={setConfirmDiscardOpen}
						onConfirm={handleConfirmDiscardItem}
					/>
					<ConfirmActionDialog
						open={deleteItemId !== null}
						onOpenChange={(open) => !open && setDeleteItemId(null)}
						onConfirm={() => {
							if (deleteItemId) handleConfirmDeleteItem(deleteItemId);
							setDeleteItemId(null);
						}}
						title="Excluir ingrediente?"
						description="Tem certeza que deseja excluir este ingrediente? Esta ação não pode ser desfeita."
						confirmLabel="Excluir"
						variant="destructive"
					/>
					<Dialog open={open} onOpenChange={handleCloseItemDialog}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg" disabled={isLoading}>
								<Plus className="w-4 h-4 mr-2" />
								Novo ingrediente
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Ingrediente *</label>
									<Input
										placeholder="Ex: Tomate, Farinha, Ovos..."
										disabled={isLoading}
										{...form.register("name")}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Descrição (opcional)</label>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Descrição detalhada do item..."
										disabled={isLoading}
										{...form.register("description")}
									/>
								</div>

						{!editId && (
							<>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Estoque Inicial *</label>
										<Input
											type="number"
											placeholder="Ex: 100"
											disabled={isLoading}
											min="0.01"
											step="0.01"
											{...form.register("quantity")}
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Tipo de Unidade *</label>
										<Select 
											value={form.watch("unit_type")} 
											onValueChange={(v: UnitType) => form.setValue("unit_type", v, { shouldDirty: true })}
											disabled={isLoading}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecione a unidade" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="grams">Gramas (g)</SelectItem>
												<SelectItem value="kg">Quilogramas (kg)</SelectItem>
												<SelectItem value="ml">Mililitros (ml)</SelectItem>
												<SelectItem value="liters">Litros (L)</SelectItem>
												<SelectItem value="unit">Unidade (un)</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Preço de Compra *</label>
										<Input
											type="number"
											placeholder="Ex: 25.50"
											disabled={isLoading}
											min="0"
											step="0.01"
											{...form.register("purchase_price")}
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-sm font-medium">Alerta de Estoque Mínimo *</label>
										<div className="flex items-center gap-2">
											<Input
												type="number"
												placeholder="Ex: 10"
												disabled={isLoading}
												min="0"
												step="0.01"
												{...form.register("alert_quantity")}
											/>
											{form.watch("unit_type") ? (
												<Badge className={`${getUnitDisplay(form.watch("unit_type") as UnitType).color} border font-semibold whitespace-nowrap`}>
													{getUnitDisplay(form.watch("unit_type") as UnitType).abbr}
												</Badge>
											) : null}
										</div>
									</div>
								</div>
								<p className="text-xs text-muted-foreground -mt-2">
									Voce será alertado quando o estoque atingir o nível mínimo configurado!
								</p>
							</>
						)}

						{editId && (
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Tipo de Unidade</label>
								<Select 
									value={form.watch("unit_type")} 
									onValueChange={() => {}}
									disabled={true}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione o tipo de unidade" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="grams">Gramas (g)</SelectItem>
										<SelectItem value="kg">Quilogramas (kg)</SelectItem>
										<SelectItem value="ml">Mililitros (ml)</SelectItem>
										<SelectItem value="liters">Litros (L)</SelectItem>
										<SelectItem value="unit">Unidade (un)</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-amber-600 dark:text-amber-500">
									⚠️ O tipo de unidade não pode ser alterado após a criação
								</p>
							</div>
						)}
				
				<Button 
							className="w-full" 
							onClick={handleSubmit}
							disabled={isLoading || (!!editId && !isDirty)}
						>
							{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{editId ? "Atualizar Ingrediente" : "Adicionar Ingrediente"}
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

			{/* Filters Section */}
			<Card>
				<CardContent className="p-4">
					<div className="space-y-4">
						{/* Filter Header */}
						<div className="flex items-center justify-between">
							<Button
								variant="ghost"
								onClick={() => setFiltersExpanded(!filtersExpanded)}
								className="flex items-center gap-2"
							>
								<Filter className="w-4 h-4" />
								<span className="font-medium">Filtros</span>
								{hasActiveFilters && (
									<Badge variant="secondary" className="ml-2">
										{[filterSearch, filterUnitType !== "all"].filter(Boolean).length}
									</Badge>
								)}
								{filtersExpanded ? (
									<ChevronDown className="w-4 h-4 ml-1" />
								) : (
									<ChevronRight className="w-4 h-4 ml-1" />
								)}
							</Button>
							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="text-muted-foreground hover:text-foreground"
								>
									<XCircle className="w-4 h-4 mr-2" />
									Limpar Filtros
								</Button>
							)}
						</div>

						{/* Filter Controls */}
						{filtersExpanded && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
								{/* Search */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Buscar</label>
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
										<Input
											placeholder="Nome ou descrição..."
											value={filterSearch}
											onChange={(e) => setFilterSearch(e.target.value)}
											className="pl-9"
										/>
									</div>
								</div>

								{/* Unit Type */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Tipo de Unidade</label>
									<Select value={filterUnitType} onValueChange={setFilterUnitType}>
										<SelectTrigger>
											<SelectValue placeholder="Todos" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos os tipos</SelectItem>
										<SelectItem value="grams">Gramas</SelectItem>
										<SelectItem value="kg">Quilogramas</SelectItem>
										<SelectItem value="ml">Mililitros</SelectItem>
										<SelectItem value="liters">Litros</SelectItem>
										<SelectItem value="unit">Unidade</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}

						{/* Results Count */}
						<div className="text-sm text-muted-foreground">
							Mostrando <span className="font-semibold text-foreground">{filteredItems.length}</span> de{" "}
							<span className="font-semibold text-foreground">{items.length}</span> {items.length === 1 ? 'item' : 'itens'}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Table Section */}
			{isLoading && items.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
						<p className="text-muted-foreground">Carregando itens...</p>
					</CardContent>
				</Card>
			) : filteredItems.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Package className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground text-center">
							{hasActiveFilters 
								? "Nenhum item encontrado com os filtros aplicados."
								: "Nenhum item cadastrado ainda. Crie seu primeiro item para começar!"
							}
						</p>
						{hasActiveFilters && (
							<Button
								variant="outline"
								size="sm"
								onClick={clearFilters}
								className="mt-4"
							>
								Limpar Filtros
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/50">
										<TableHead className="font-bold">Item</TableHead>
										<TableHead className="font-bold">Descrição</TableHead>
										<TableHead className="font-bold">Tipo de Unidade</TableHead>
										<TableHead className="text-right font-bold">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredItems.map((item) => (
										<TableRow key={item.id} className="hover:bg-muted/30">
											<TableCell className="font-semibold">
												{item.name}
											</TableCell>
											<TableCell className="text-muted-foreground max-w-md">
												{item.description || (
													<span className="text-muted-foreground/50 italic">Sem descrição</span>
												)}
											</TableCell>
											<TableCell>
												<Badge className={`${getUnitDisplay(item.unit_type).color} border font-semibold`}>
													{getUnitDisplay(item.unit_type).label}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-primary/10 hover:text-primary"
														onClick={() => startEdit(item)}
														disabled={isLoading}
													>
														<Pencil className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
													className="text-destructive hover:bg-destructive/10 hover:text-destructive"
														onClick={() => setDeleteItemId(item.id)}
														disabled={isLoading}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { AlertTriangle, Package, Pencil, Plus, Trash2, Loader2, ChevronDown, ChevronRight, Box, AlertCircle, Filter, XCircle, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { UnitType } from "@/types/api";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

// Helper function to get unit display information
const getUnitDisplay = (unitType: UnitType) => {
	const displays = {
		grams: { label: 'Gramas', abbr: 'g', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500', decimals: 2 },
		kg: { label: 'Quilogramas', abbr: 'kg', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500', decimals: 2 },
		ml: { label: 'Mililitros', abbr: 'ml', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-500', decimals: 2 },
		liters: { label: 'Litros', abbr: 'L', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-500', decimals: 2 },
		unit: { label: 'Unidade', abbr: 'un', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-500', decimals: 0 }
	};
	return displays[unitType];
};

export default function InventoryPage() {
	const location = useLocation();
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
		clearError 
	} = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [form, setForm] = useState({ 
		name: "", 
		description: "", 
		unit_type: "" as "grams" | "unit" | "ml" | "liters" | "kg" | "",
		quantity: "",
		alert_quantity: ""
	});

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filterSearch, setFilterSearch] = useState("");
	const [filterUnitType, setFilterUnitType] = useState<string>("all");
	const [filterStockStatus, setFilterStockStatus] = useState<string>("all"); // all, low, normal, no-stock

	// Fetch items and stock on mount
	useEffect(() => {
		Promise.all([
			fetchItems(),
			fetchStock()
		]).catch(err => {
			console.error('Failed to load data:', err);
		});
	}, [fetchItems, fetchStock]);

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
		setForm({ 
			name: "", 
			description: "", 
			unit_type: "" as "",
			quantity: "",
			alert_quantity: ""
		});
		setEditId(null);
	};

	const handleSubmit = async () => {
		if (!form.name.trim() || !form.unit_type) {
			toast.error('Por favor, preencha os campos obrigatórios');
			return;
		}

		const quantity = parseFloat(form.quantity);
		const alertQty = form.alert_quantity ? parseFloat(form.alert_quantity) : null;

		if (alertQty !== null && (isNaN(alertQty) || alertQty < 0)) {
			toast.error('Por favor, insira uma quantidade de alerta válida');
			return;
		}

		try {
			const itemData = {
				name: form.name.trim(),
				unit_type: form.unit_type,
				description: form.description.trim() || null,
			};

			if (editId) {
				await updateItem(editId, itemData);
				toast.success('Item atualizado com sucesso!');
			} else {
				// Create item first
				const newItem = await createItem(itemData);
				
				// Then create stock for the item
				const stockData = {
					itemId: newItem.id,
					quantity: quantity,
					alert_quantity: alertQty
				};
				await createStock(stockData);
				
				toast.success('Item e estoque criados com sucesso!');
			}
			resetForm();
			setOpen(false);
		} catch (err: any) {
			console.error('Failed to save item:', err);
			toast.error(err.message || 'Erro ao salvar item');
		}
	};

	const startEdit = (item: typeof items[0]) => {
		setEditId(item.id);
		setForm({
			name: item.name,
			description: item.description || "",
			unit_type: item.unit_type,
			quantity: "",
			alert_quantity: ""
		});
		setOpen(true);
	};

	const handleConfirmDeleteItem = async (id: string) => {
		try {
			await deleteItem(id);
			toast.success('Item excluído com sucesso!');
		} catch (err: unknown) {
			console.error('Failed to delete item:', err);
			toast.error((err as Error)?.message || 'Erro ao excluir item');
		}
	};

	const toggleRow = (itemId: string) => {
		setExpandedRows(prev => {
			const newSet = new Set(prev);
			if (newSet.has(itemId)) {
				newSet.delete(itemId);
			} else {
				newSet.add(itemId);
			}
			return newSet;
		});
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

			// Stock status filter
			if (filterStockStatus !== "all") {
				const itemStock = stock.find(s => s.item_id === item.id);
				
				if (filterStockStatus === "no-stock" && itemStock) return false;
				if (filterStockStatus === "low") {
					if (!itemStock) return false;
					const isLowStock = itemStock.alert_quantity !== null && itemStock.quantity <= itemStock.alert_quantity;
					if (!isLowStock) return false;
				}
				if (filterStockStatus === "normal") {
					if (!itemStock) return false;
					const isLowStock = itemStock.alert_quantity !== null && itemStock.quantity <= itemStock.alert_quantity;
					if (isLowStock) return false;
				}
			}

			return true;
		});
	}, [items, stock, filterSearch, filterUnitType, filterStockStatus]);

	const hasActiveFilters = filterSearch !== "" || filterUnitType !== "all" || filterStockStatus !== "all";

	const clearFilters = () => {
		setFilterSearch("");
		setFilterUnitType("all");
		setFilterStockStatus("all");
	};

	// Count low stock items
	const lowStockCount = useMemo(() => {
		return items.filter(item => {
			const itemStock = stock.find(s => s.item_id === item.id);
			return itemStock && itemStock.alert_quantity !== null && itemStock.quantity <= itemStock.alert_quantity;
		}).length;
	}, [items, stock]);

	return (
		<div className="space-y-6">
			{/* Low Stock Alert Banner */}
			{lowStockCount > 0 && (
				<Alert variant="destructive" className="border-2 border-amber-500 bg-amber-500/10 dark:bg-amber-500/5">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-amber-500 rounded-full animate-pulse">
							<AlertTriangle className="h-5 w-5 text-white" />
						</div>
						<div className="flex-1">
							<AlertDescription className="text-base font-semibold text-amber-900 dark:text-amber-200">
								⚠️ Atenção! {lowStockCount} {lowStockCount === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'}
							</AlertDescription>
							<p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
								Alguns ingredientes estão abaixo do nível de alerta. Considere reabastecer em breve.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="border-amber-600 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
							onClick={() => {
								setFilterStockStatus("low");
								setFiltersExpanded(true);
							}}
						>
							Ver Itens
						</Button>
					</div>
				</Alert>
			)}

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<Package className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Controle de itens</h1>
							<p className="text-slate-300 mt-1">Gerencie seus ingredientes</p>
						</div>
					</div>
					<ConfirmActionDialog
						open={deleteItemId !== null}
						onOpenChange={(open) => !open && setDeleteItemId(null)}
						onConfirm={() => {
							if (deleteItemId) handleConfirmDeleteItem(deleteItemId);
							setDeleteItemId(null);
						}}
						title="Excluir item?"
						description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
						confirmLabel="Excluir"
						variant="destructive"
					/>
					<Dialog
						open={open}
						onOpenChange={(v) => {
							setOpen(v);
							if (!v) resetForm();
						}}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg" disabled={isLoading}>
								<Plus className="w-4 h-4 mr-2" />
								Adicionar Item
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Item *</label>
									<Input
										placeholder="Ex: Tomate, Farinha, Ovos..."
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Descrição (opcional)</label>
									<Input
										placeholder="Descrição do item"
										value={form.description}
										onChange={(e) => setForm({ ...form, description: e.target.value })}
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Tipo de Unidade *</label>
									<Select 
										value={form.unit_type} 
									onValueChange={(v: "grams" | "unit" | "ml" | "liters" | "kg") => setForm({ ...form, unit_type: v })}
									disabled={isLoading}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione o tipo" />
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
								{!editId && (
									<>
										<div className="space-y-1.5">
											<label className="text-sm font-medium">Quantidade Inicial *</label>
											<Input
												type="number"
												placeholder={form.unit_type ? `Ex: ${form.unit_type === 'unit' ? '10' : '1000'}` : "Selecione o tipo primeiro"}
												value={form.quantity}
												onChange={(e) => setForm({ ...form, quantity: e.target.value })}
												disabled={isLoading}
												min="0"
												step={form.unit_type === 'unit' ? "1" : "0.01"}
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-sm font-medium">Quantidade de Alerta (opcional)</label>
											<Input
												type="number"
												placeholder={form.unit_type ? `Ex: ${form.unit_type === 'unit' ? '5' : '100'}` : "Selecione o tipo primeiro"}
												value={form.alert_quantity}
												onChange={(e) => setForm({ ...form, alert_quantity: e.target.value })}
												disabled={isLoading}
												min="0"
												step={form.unit_type === 'unit' ? "1" : "0.01"}
											/>
											<p className="text-xs text-muted-foreground">
												Você será alertado quando o estoque atingir este nível
											</p>
										</div>
									</>
								)}
								<div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
									<p className="font-medium mb-1">💡 Dica sobre unidades:</p>
									<p><strong>Gramas/Kg:</strong> Ingredientes medidos por peso (farinha, açúcar, carne)</p>
									<p><strong>ML/Litros:</strong> Líquidos (leite, óleo, água)</p>
									<p><strong>Unidade:</strong> Itens contáveis (ovos, latas, garrafas)</p>
								</div>
								<Button 
									className="w-full" 
									onClick={handleSubmit}
									disabled={isLoading}
								>
									{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
									{editId ? "Atualizar" : "Adicionar Item"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Filters Section */}
			<Card>
				<CardContent className="p-4">
					<div className="space-y-4">
						{/* Filter Header */}
						<div className="flex items-center justify-between">
							<Button
								variant="ghost"
								onClick={() => setFiltersExpanded(!filtersExpanded)}
								className="flex items-center gap-2 hover:bg-muted"
							>
								<Filter className="w-4 h-4" />
								<span className="font-medium">Filtros</span>
								{hasActiveFilters && (
									<Badge variant="secondary" className="ml-2">
										{[filterSearch, filterUnitType !== "all", filterStockStatus !== "all"].filter(Boolean).length}
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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
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
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="grams">Gramas</SelectItem>
											<SelectItem value="kg">Quilogramas</SelectItem>
											<SelectItem value="ml">Mililitros</SelectItem>
											<SelectItem value="liters">Litros</SelectItem>
											<SelectItem value="unit">Unidade</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Stock Status */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Status do Estoque</label>
									<Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
										<SelectTrigger>
											<SelectValue placeholder="Todos" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos</SelectItem>
											<SelectItem value="low">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 rounded-full bg-amber-500" />
													Estoque Baixo
												</div>
											</SelectItem>
											<SelectItem value="normal">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 rounded-full bg-green-500" />
													Normal
												</div>
											</SelectItem>
											<SelectItem value="no-stock">Sem Estoque Cadastrado</SelectItem>
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
						<p className="text-muted-foreground">
							{hasActiveFilters 
								? "Nenhum item encontrado com os filtros aplicados."
								: "Nenhum item ainda. Adicione seu primeiro item para começar."
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
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="w-12"></TableHead>
									<TableHead className="font-bold">Item</TableHead>
									<TableHead className="font-bold">Descrição</TableHead>
									<TableHead className="font-bold">Tipo de Unidade</TableHead>
									<TableHead className="font-bold">Data de Criação</TableHead>
									<TableHead className="text-right font-bold">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredItems.map((item) => {
									const itemStock = stock.find(s => s.item_id === item.id);
									const hasStock = !!itemStock;
									const isExpanded = expandedRows.has(item.id);
									const isLowStock = itemStock && itemStock.alert_quantity !== null && itemStock.quantity <= itemStock.alert_quantity;
									
									return (
										<>
											<TableRow key={item.id} className="hover:bg-muted/30">
												<TableCell className="p-0">
													{hasStock && (
														<Button
															variant="ghost"
															size="icon"
															className="w-full h-full rounded-none hover:bg-transparent"
															onClick={() => toggleRow(item.id)}
														>
															{isExpanded ? (
																<ChevronDown className="w-4 h-4 text-muted-foreground" />
															) : (
																<ChevronRight className="w-4 h-4 text-muted-foreground" />
															)}
														</Button>
													)}
												</TableCell>
												<TableCell className="font-semibold">
													<div className="flex items-center gap-2">
														{item.name}
														{isLowStock && (
															<AlertCircle className="w-4 h-4 text-amber-500" />
														)}
													</div>
												</TableCell>
												<TableCell className="text-muted-foreground">
													{item.description || (
														<span className="text-muted-foreground/50 italic">Sem descrição</span>
													)}
												</TableCell>
												<TableCell>
													<span className={`px-2 py-1 rounded-full font-semibold text-sm ${getUnitDisplay(item.unit_type).color}`}>
														{getUnitDisplay(item.unit_type).label}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{item.created_at ? new Date(item.created_at).toLocaleDateString('EN-us') : '—'}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															variant="ghost"
															size="icon"
															className="hover:bg-primary/10 hover:text-primary"
															onClick={() => startEdit(item)}
															disabled={isLoading}>
															<Pencil className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="hover:bg-destructive/10 hover:text-destructive"
															onClick={() => setDeleteItemId(item.id)}
															disabled={isLoading}>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
											
											{/* Stock Details Expanded Row */}
											{hasStock && isExpanded && (
												<TableRow key={`${item.id}-details`}>
													<TableCell colSpan={6} className="bg-muted/30 p-0">
														<div className="p-4">
															<div className="bg-background rounded-lg p-4 border">
																<div className="flex items-center gap-2 mb-4">
																	<Box className="w-5 h-5 text-primary" />
																	<h4 className="font-semibold">Informações de Estoque</h4>
																</div>
																<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
																	{/* Available Quantity */}
																	<div className="space-y-1">
																		<p className="text-xs text-muted-foreground font-medium">Quantidade Disponível</p>
																		<p className="text-2xl font-bold text-green-600 dark:text-green-500">
																			{itemStock.quantity.toLocaleString('EN-us', { 
																				minimumFractionDigits: getUnitDisplay(item.unit_type).decimals,
																				maximumFractionDigits: getUnitDisplay(item.unit_type).decimals
																			})}
																			<span className="text-sm ml-1 font-normal">
																				{getUnitDisplay(item.unit_type).abbr}
																			</span>
																		</p>
																	</div>
																	
																	{/* Reserved Quantity */}
																	<div className="space-y-1">
																		<p className="text-xs text-muted-foreground font-medium">Quantidade Reservada</p>
																		<p className="text-2xl font-bold text-amber-600 dark:text-amber-500">
																			{itemStock.reserved_quantity.toLocaleString('EN-us', { 
																				minimumFractionDigits: getUnitDisplay(item.unit_type).decimals,
																				maximumFractionDigits: getUnitDisplay(item.unit_type).decimals
																			})}
																			<span className="text-sm ml-1 font-normal">
																				{getUnitDisplay(item.unit_type).abbr}
																			</span>
																		</p>
																	</div>
																	
																	{/* Alert Quantity */}
																	<div className="space-y-1">
																		<p className="text-xs text-muted-foreground font-medium">Quantidade de Alerta</p>
																		<p className="text-2xl font-bold">
																			{itemStock.alert_quantity !== null ? (
																				<>
																					{itemStock.alert_quantity.toLocaleString('EN-us', { 
																						minimumFractionDigits: getUnitDisplay(item.unit_type).decimals,
																						maximumFractionDigits: getUnitDisplay(item.unit_type).decimals
																					})}
																					<span className="text-sm ml-1 font-normal">
																						{getUnitDisplay(item.unit_type).abbr}
																					</span>
																				</>
																			) : (
																				<span className="text-muted-foreground text-base">Não configurado</span>
																			)}
																		</p>
																	</div>
																	
																	{/* Stock Status */}
																	<div className="space-y-1">
																		<p className="text-xs text-muted-foreground font-medium">Status</p>
																		<div className="flex items-center gap-2 mt-1">
																			{isLowStock ? (
																				<div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full">
																					<AlertCircle className="w-4 h-4" />
																					<span className="text-sm font-semibold">Estoque Baixo</span>
																				</div>
																			) : (
																				<div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-500 rounded-full">
																					<Box className="w-4 h-4" />
																					<span className="text-sm font-semibold">Normal</span>
																				</div>
																			)}
																		</div>
																	</div>
																</div>
																
																{/* Stock ID for reference */}
																<div className="mt-4 pt-4 border-t">
																	<p className="text-xs text-muted-foreground">
																		ID do Estoque: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{itemStock.id}</code>
																	</p>
																</div>
															</div>
														</div>
													</TableCell>
												</TableRow>
											)}
										</>
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

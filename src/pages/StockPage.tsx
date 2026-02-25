import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import type { UnitType } from "@/types/api";
import {
	AlertCircle,
	ArrowDownCircle,
	ArrowUpCircle,
	ChevronDown,
	ChevronRight,
	Edit,
	Filter,
	History,
	Loader2,
	Minus,
	Package,
	Plus,
	Search,
	TrendingDown,
	TrendingUp,
	XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";

type OperationFormValues = {
	operationQuantity: string;
	operationPurchasePrice: string;
	operationAlertQuantity: string;
};

type EditFormValues = {
	editName: string;
	editDescription: string;
	editAlertQuantity: string;
};

const OPERATION_DEFAULT_VALUES: OperationFormValues = {
	operationQuantity: "",
	operationPurchasePrice: "",
	operationAlertQuantity: "",
};

const EDIT_DEFAULT_VALUES: EditFormValues = {
	editName: "",
	editDescription: "",
	editAlertQuantity: "",
};

// Helper function to get unit display information
const getUnitDisplay = (unitType: UnitType) => {
	const displays = {
		grams: { label: 'Gramas', abbr: 'g', decimals: 2, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-800' },
		kg: { label: 'Quilogramas', abbr: 'kg', decimals: 2, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-200 dark:border-indigo-800' },
		ml: { label: 'Mililitros', abbr: 'ml', decimals: 2, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 border-cyan-200 dark:border-cyan-800' },
		liters: { label: 'Litros', abbr: 'L', decimals: 2, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-500 border-teal-200 dark:border-teal-800' },
		unit: { label: 'Unidade', abbr: 'un', decimals: 0, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-200 dark:border-purple-800' }
	};
	return displays[unitType];
};

export default function StockPage() {
	const { 
		items,
		stock,
		stockHistory,
		isLoading, 
		error, 
		fetchItems,
		fetchStock,
		fetchStockHistory,
		updateStock,
		updateItem,
		clearError 
	} = useRestaurantStore();
	
	const [operationOpen, setOperationOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
	const [operation, setOperation] = useState<"add" | "remove">("add");
	const [confirmOperationDiscardOpen, setConfirmOperationDiscardOpen] = useState(false);
	const [confirmEditDiscardOpen, setConfirmEditDiscardOpen] = useState(false);

	const operationForm = useForm<OperationFormValues>({ defaultValues: OPERATION_DEFAULT_VALUES });
	const editForm = useForm<EditFormValues>({ defaultValues: EDIT_DEFAULT_VALUES });
	const isOperationDirty = operationForm.formState.isDirty;
	const isEditDirty = editForm.formState.isDirty;

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filterSearch, setFilterSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all"); // all, low, normal, out

	// Fetch data on mount
	useEffect(() => {
		Promise.all([
			fetchItems(),
			fetchStock(),
			fetchStockHistory()
		]).catch(err => {
			console.error('Failed to load data:', err);
		});
	}, [fetchItems, fetchStock, fetchStockHistory]);

	// Auto-clear errors after 5 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				clearError();
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const resetOperationForm = () => {
		operationForm.reset(OPERATION_DEFAULT_VALUES);
	};
	const resetEditForm = () => {
		editForm.reset(EDIT_DEFAULT_VALUES);
	};

	const handleStockOperation = async () => {
		const f = operationForm.getValues();
		if (!selectedStockId || !f.operationQuantity) {
			showErrorToast('Por favor, informe a quantidade');
			return;
		}
		if (operation === 'add' && !f.operationPurchasePrice) {
			showErrorToast('Por favor, informe o preço de compra');
			return;
		}
		const quantity = parseFloat(f.operationQuantity);
		const alertQty = f.operationAlertQuantity ? parseFloat(f.operationAlertQuantity) : undefined;
		const purchasePrice = f.operationPurchasePrice ? parseFloat(f.operationPurchasePrice) : undefined;
		if (isNaN(quantity) || quantity < 0.01) {
			showErrorToast('Quantidade deve ser maior que 0');
			return;
		}
		if (operation === 'add' && purchasePrice !== undefined && (isNaN(purchasePrice) || purchasePrice < 0)) {
			showErrorToast('Preço de compra inválido');
			return;
		}
		try {
			await updateStock(selectedStockId, {
				operation,
				quantity,
				purchase_price: operation === 'add' ? purchasePrice : undefined,
				alert_quantity: alertQty
			} as any);
			showSuccessToast(`Estoque ${operation === 'add' ? 'adicionado' : 'removido'} com sucesso!`);
			resetOperationForm();
			setOperationOpen(false);
			setSelectedStockId(null);
			await Promise.all([fetchStock(), fetchStockHistory()]);
		} catch (err: unknown) {
			console.error('Failed to update stock:', err);
			showErrorToast((err as Error)?.message || 'Erro ao atualizar estoque');
		}
	};

	const openOperation = (stockId: string, op: "add" | "remove") => {
		setSelectedStockId(stockId);
		setOperation(op);
		operationForm.reset(OPERATION_DEFAULT_VALUES);
		setOperationOpen(true);
	};

	const startEdit = (stockId: string) => {
		const stockItem = stock.find(s => s.id === stockId);
		if (!stockItem) return;
		const item = items.find(i => i.id === stockItem.item_id);
		if (!item) return;
		const editAlertQuantity = stockItem.alert_quantity !== null ? Number(stockItem.alert_quantity).toFixed(2) : "";
		setSelectedStockId(stockId);
		editForm.reset({
			editName: item.name,
			editDescription: item.description || "",
			editAlertQuantity,
		});
		setEditOpen(true);
	};

	const handleEdit = async () => {
		if (!selectedStockId) {
			showErrorToast('Nenhum estoque selecionado');
			return;
		}
		const f = editForm.getValues();
		if (!f.editName.trim()) {
			showErrorToast('Nome é obrigatório');
			return;
		}
		const alertQty = f.editAlertQuantity ? parseFloat(f.editAlertQuantity) : null;
		if (f.editAlertQuantity && (alertQty === null || isNaN(alertQty) || alertQty < 0)) {
			showErrorToast('Quantidade de alerta inválida');
			return;
		}
		try {
			const currentStock = stock.find(s => s.id === selectedStockId);
			if (!currentStock) {
				showErrorToast('Estoque não encontrado');
				return;
			}
			await updateItem(currentStock.item_id, {
				name: f.editName,
				description: f.editDescription || null
			});
			await updateStock(selectedStockId, {
				operation: 'add',
				quantity: 0,
				alert_quantity: alertQty
			});
			showSuccessToast('Ingrediente atualizado com sucesso!');
			resetEditForm();
			setEditOpen(false);
			setSelectedStockId(null);
			await Promise.all([fetchItems(), fetchStock()]);
		} catch (err: unknown) {
			console.error('Failed to update item:', err);
			showErrorToast((err as Error)?.message || 'Erro ao atualizar item');
		}
	};

	const handleCloseOperationDialog = (v: boolean) => {
		if (!v) {
			if (isOperationDirty) setConfirmOperationDiscardOpen(true);
			else {
				setOperationOpen(false);
				resetOperationForm();
				setSelectedStockId(null);
			}
		} else {
			setOperationOpen(v);
			operationForm.reset(OPERATION_DEFAULT_VALUES);
		}
	};

	const handleConfirmDiscardOperation = () => {
		setOperationOpen(false);
		resetOperationForm();
		setSelectedStockId(null);
		setConfirmOperationDiscardOpen(false);
	};

	const handleCloseEditDialog = (v: boolean) => {
		if (!v) {
			if (isEditDirty) setConfirmEditDiscardOpen(true);
			else {
				setEditOpen(false);
				resetEditForm();
				setSelectedStockId(null);
			}
		} else {
			setEditOpen(v);
		}
	};

	const handleConfirmDiscardEdit = () => {
		setEditOpen(false);
		resetEditForm();
		setSelectedStockId(null);
		setConfirmEditDiscardOpen(false);
	};

	// Join stock with item data
	const stockWithItems = useMemo(() => {
		return stock.map(s => {
			const item = items.find(i => i.id === s.item_id);
			return {
				...s,
				item
			};
		}).filter(s => s.item); // Only include stocks with valid items
	}, [stock, items]);

	// Apply filters
	const filteredStock = useMemo(() => {
		return stockWithItems.filter((s) => {
			// Search filter
			if (filterSearch) {
				const searchLower = filterSearch.toLowerCase();
				const matchName = s.item?.name.toLowerCase().includes(searchLower);
				const matchDescription = s.item?.description?.toLowerCase().includes(searchLower);
				if (!matchName && !matchDescription) return false;
			}

			// Status filter
			if (filterStatus !== "all") {
				const isOut = s.quantity <= 0;
				const isLow = s.alert_quantity !== null && s.quantity <= s.alert_quantity && s.quantity > 0;
				
				if (filterStatus === "out" && !isOut) return false;
				if (filterStatus === "low" && !isLow) return false;
				if (filterStatus === "normal" && (isLow || isOut)) return false;
			}

			return true;
		});
	}, [stockWithItems, filterSearch, filterStatus]);

	const hasActiveFilters = filterSearch !== "" || filterStatus !== "all";

	const clearFilters = () => {
		setFilterSearch("");
		setFilterStatus("all");
	};

	// Statistics
	const stats = useMemo(() => {
		const lowStock = stockWithItems.filter(s => 
			s.alert_quantity !== null && s.quantity <= s.alert_quantity && s.quantity > 0
		).length;
		
		const outOfStock = stockWithItems.filter(s => s.quantity <= 0).length;
		
		const totalValue = stockWithItems.reduce((sum, s) => {
			const qty = Number(s.quantity) || 0;
			return sum + qty;
		}, 0);
		
		const recentActivity = stockHistory.slice(0, 5);

		return {
			total: stockWithItems.length,
			lowStock,
			outOfStock,
			totalValue: Number(totalValue).toFixed(2),
			recentActivity
		};
	}, [stockWithItems, stockHistory]);

	const getStockStatus = (s: typeof stockWithItems[0]) => {
		if (s.quantity <= 0) return { status: 'out', label: 'Esgotado', color: 'bg-red-500' };
		if (s.alert_quantity !== null && s.quantity <= s.alert_quantity) return { status: 'low', label: 'Baixo', color: 'bg-amber-500' };
		return { status: 'normal', label: 'Normal', color: 'bg-green-500' };
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-primary/20 rounded-lg">
						<Package className="w-8 h-8 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white">Controle de Estoque</h1>
						<p className="text-slate-300 mt-1">
							Gerencie a quantidade dos ingredientes, defina alertas e acompanhe o histórico de movimentações.
						</p>
					</div>
				</div>
			</div>

			<ConfirmDiscardDialog
				open={confirmOperationDiscardOpen}
				onOpenChange={setConfirmOperationDiscardOpen}
				onConfirm={handleConfirmDiscardOperation}
			/>
			<ConfirmDiscardDialog
				open={confirmEditDiscardOpen}
				onOpenChange={setConfirmEditDiscardOpen}
				onConfirm={handleConfirmDiscardEdit}
			/>
			{/* Stock Operation Dialog */}
			<Dialog open={operationOpen} onOpenChange={handleCloseOperationDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{operation === 'add' ? (
								<span className="flex items-center gap-2">
									<ArrowUpCircle className="w-5 h-5 text-green-600" />
									Adicionar ao Estoque
								</span>
							) : (
								<span className="flex items-center gap-2">
									<ArrowDownCircle className="w-5 h-5 text-red-600" />
									Remover do Estoque
								</span>
							)}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium">Quantidade *</label>
							<Input
								type="number"
								placeholder={operation === 'add' ? "Quantidade a adicionar" : "Quantidade a remover"}
								disabled={isLoading}
								min="0.01"
								step="0.01"
								autoFocus
								{...operationForm.register("operationQuantity")}
							/>
						</div>
						{operation === 'add' && (
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Preço de Compra *</label>
								<Input
									type="number"
									placeholder="Ex: 25.50"
									disabled={isLoading}
									min="0"
									step="0.01"
									{...operationForm.register("operationPurchasePrice")}
								/>
								<p className="text-xs text-muted-foreground">
									Valor de custo/compra deste reabastecimento
								</p>
							</div>
						)}
						<div className="space-y-1.5">
							<label className="text-sm font-medium">Atualizar Quantidade de Alerta (opcional)</label>
							<Input
								type="number"
								placeholder="Nova quantidade de alerta"
								disabled={isLoading}
								min="0"
								step="0.01"
								{...operationForm.register("operationAlertQuantity")}
							/>
						</div>
						
						<Button 
							className="w-full" 
							onClick={handleStockOperation}
							disabled={isLoading}
							variant={operation === 'add' ? 'default' : 'destructive'}
						>
							{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{operation === 'add' ? 'Adicionar' : 'Remover'}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Stock Dialog */}
			<Dialog open={editOpen} onOpenChange={handleCloseEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<span className="flex items-center gap-2">
								<Edit className="w-5 h-5 text-blue-600" />
								Editar Ingrediente
							</span>
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium">Nome do Ingrediente *</label>
							<Input
								placeholder="Ex: Tomate, Farinha, Ovos..."
								disabled={isLoading}
								autoFocus
								{...editForm.register("editName")}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium">Descrição (opcional)</label>
							<textarea
								className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								placeholder="Descrição detalhada do item..."
								disabled={isLoading}
								{...editForm.register("editDescription")}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium">
								Quantidade de Alerta
								{selectedStockId && (() => {
									const stockItem = stock.find(s => s.id === selectedStockId);
									const item = stockItem ? items.find(i => i.id === stockItem.item_id) : null;
									const unit = item ? getUnitDisplay(item.unit_type) : null;
									return unit ? ` (${unit.abbr})` : '';
								})()}
							</label>
							<Input
								type="number"
								placeholder="Ex: 10"
								disabled={isLoading}
								min="0"
								step="0.01"
								{...editForm.register("editAlertQuantity")}
							/>
							<p className="text-xs text-muted-foreground">
								Deixe em branco para remover o alerta
							</p>
						</div>
						
						<Button 
							className="w-full" 
							onClick={handleEdit}
							disabled={isLoading || !isEditDirty}
						>
							{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Salvar Alterações
						</Button>
					</div>
				</DialogContent>
			</Dialog>

		{/* Error Alert */}
		{error && (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		)}

		{/* Low Stock Warning */}
		{stats.lowStock > 0 && (
			<Alert className="border-amber-600 bg-amber-50 dark:bg-amber-950/20">
				<div className="flex items-center gap-4">
					<div className="p-2 bg-amber-500 rounded-full animate-pulse">
						<AlertCircle className="h-5 w-5 text-white" />
					</div>
					<div className="flex-1">
						<AlertDescription className="text-base font-semibold text-amber-900 dark:text-amber-200">
							⚠️ Atenção! {stats.lowStock} {stats.lowStock === 1 ? 'item com estoque baixo' : 'itens com estoque baixo'}
						</AlertDescription>
						<p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
							Alguns itens estão abaixo do nível de alerta. Considere reabastecer.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="border-amber-600 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
						onClick={() => {
							setFilterStatus("low");
							setFiltersExpanded(true);
						}}
					>
						Ver Itens
					</Button>
				</div>
			</Alert>
		)}

			<Tabs defaultValue="stock" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="stock">Estoque Atual</TabsTrigger>
					<TabsTrigger value="history">Histórico de Movimentações</TabsTrigger>
				</TabsList>

				<TabsContent value="stock" className="space-y-4 mt-4">
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
												{[filterSearch, filterStatus !== "all"].filter(Boolean).length}
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
													placeholder="Nome do item..."
													value={filterSearch}
													onChange={(e) => setFilterSearch(e.target.value)}
													className="pl-9"
												/>
											</div>
										</div>

										{/* Status */}
										<div className="space-y-2">
											<label className="text-sm font-medium">Status do Estoque</label>
											<Select value={filterStatus} onValueChange={setFilterStatus}>
												<SelectTrigger>
													<SelectValue placeholder="Todos" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">Todos os status</SelectItem>
													<SelectItem value="normal">
														<div className="flex items-center gap-2">
															<div className="w-2 h-2 rounded-full bg-green-500" />
															Normal
														</div>
													</SelectItem>
													<SelectItem value="low">
														<div className="flex items-center gap-2">
															<div className="w-2 h-2 rounded-full bg-amber-500" />
															Estoque Baixo
														</div>
													</SelectItem>
													<SelectItem value="out">
														<div className="flex items-center gap-2">
															<div className="w-2 h-2 rounded-full bg-red-500" />
															Esgotado
														</div>
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								)}

								{/* Results Count */}
								<div className="text-sm text-muted-foreground">
									Mostrando <span className="font-semibold text-foreground">{filteredStock.length}</span> de{" "}
									<span className="font-semibold text-foreground">{stockWithItems.length}</span> estoques
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Stock Table/Cards */}
					{isLoading && stock.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
								<p className="text-muted-foreground">Carregando estoque...</p>
							</CardContent>
						</Card>
					) : filteredStock.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Package className="w-12 h-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground text-center">
									{hasActiveFilters 
										? "Nenhum estoque encontrado com os filtros aplicados."
										: "Nenhum estoque cadastrado ainda. Crie o primeiro estoque para começar!"
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
											<TableHead className="font-bold">Situação</TableHead>
											<TableHead className="font-bold">Ingrediente</TableHead>
											<TableHead className="font-bold">Descrição</TableHead>
											<TableHead className="font-bold">Tipo de Unidade</TableHead>
											<TableHead className="font-bold text-right">Disponível</TableHead>
											<TableHead className="font-bold text-right">Reservado</TableHead>
											<TableHead className="font-bold text-right">Alerta</TableHead>
												<TableHead className="text-right font-bold">Ações</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredStock.map((s) => {
												const status = getStockStatus(s);
												const unitDisplay = getUnitDisplay(s.item!.unit_type);
												
												return (
													<TableRow key={s.id} className="hover:bg-muted/30">
														<TableCell>
															<Badge 
																variant="outline" 
																className={`${
																	status.status === 'out' ? 'border-red-500 text-red-700 dark:text-red-400' :
																	status.status === 'low' ? 'border-amber-500 text-amber-700 dark:text-amber-400' :
																	'border-green-500 text-green-700 dark:text-green-400'
																} font-semibold`}
															>
																{status.label}
															</Badge>
														</TableCell>
														<TableCell className="font-semibold">
															{s.item!.name}
														</TableCell>
														<TableCell className="text-muted-foreground max-w-md">
															{s.item!.description || (
																<span className="text-muted-foreground/50 italic">Sem descrição</span>
															)}
														</TableCell>
														<TableCell>
															<Badge className={`${unitDisplay.color} border font-semibold`}>
																{unitDisplay.label}
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-semibold text-green-600 dark:text-green-500">
																{Number(s.quantity).toLocaleString('EN-us', { 
																	minimumFractionDigits: unitDisplay.decimals,
																	maximumFractionDigits: unitDisplay.decimals
																})} {unitDisplay.abbr}
															</span>
														</TableCell>
														<TableCell className="text-right">
															{s.reserved_quantity > 0 ? (
																<span className="font-semibold text-amber-600 dark:text-amber-500">
																	{Number(s.reserved_quantity).toLocaleString('EN-us', { 
																		minimumFractionDigits: unitDisplay.decimals,
																		maximumFractionDigits: unitDisplay.decimals
																	})} {unitDisplay.abbr}
																</span>
															) : (
																<span className="text-muted-foreground/50">-</span>
															)}
														</TableCell>
														<TableCell className="text-right">
															{s.alert_quantity !== null ? (
																<span className="font-semibold">
																	{Number(s.alert_quantity).toLocaleString('EN-us', { 
																		minimumFractionDigits: unitDisplay.decimals,
																		maximumFractionDigits: unitDisplay.decimals
																	})} {unitDisplay.abbr}
																</span>
															) : (
																<span className="text-muted-foreground/50">-</span>
															)}
														</TableCell>
														<TableCell className="text-right">
															<div className="flex items-center justify-end gap-2">
																<Button
																	variant="outline"
																	size="sm"
																	className="hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-500 hover:border-green-500"
																	onClick={() => openOperation(s.id, 'add')}
																	disabled={isLoading}
																>
																	<Plus className="w-4 h-4 mr-1" />
																	Reabastecer
																</Button>
																<Button
																	variant="outline"
																	size="sm"
																	className="hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-500 hover:border-red-500"
																	onClick={() => openOperation(s.id, 'remove')}
																	disabled={isLoading}
																>
																	<Minus className="w-4 h-4 mr-1" />
																	Remover
																</Button>															<Button
																variant="outline"
																size="sm"
																className="hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-500 hover:border-blue-500"
																onClick={() => startEdit(s.id)}
																disabled={isLoading}
															>
																<Edit className="w-4 h-4 mr-1" />
																Editar
															</Button>															</div>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="history" className="space-y-4 mt-4">
					{/* History Table */}
					{isLoading && stockHistory.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
								<p className="text-muted-foreground">Carregando histórico...</p>
							</CardContent>
						</Card>
					) : stockHistory.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12">
								<History className="w-12 h-12 text-muted-foreground mb-4" />
								<p className="text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/50">
												<TableHead className="font-bold">Data/Hora</TableHead>
												<TableHead className="font-bold">Ingrediente</TableHead>
												<TableHead className="font-bold">Operação</TableHead>
												<TableHead className="font-bold">Quantidade</TableHead>
												<TableHead className="font-bold text-right">Preço de Compra</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{stockHistory.map((entry) => {
												const stockEntry = stock.find(s => s.id === entry.stock_id);
												const unitType = stockEntry?.item?.unit_type || 'unit';
												const unitDisplay = getUnitDisplay(unitType as UnitType);
												
												return (
												<TableRow key={entry.id} className="hover:bg-muted/30">
													<TableCell className="font-medium">
														{new Date(entry.created_at).toLocaleString('EN-us', {
															day: '2-digit',
															month: 'short',
															year: 'numeric',
															hour: '2-digit',
															minute: '2-digit'
														})}
													</TableCell>
													<TableCell className="font-semibold">
														{entry.item_name}
													</TableCell>
													<TableCell>
														{entry.operation === 'add' ? (
															<Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
																<TrendingUp className="w-3 h-3 mr-1" />
																Entrada
															</Badge>
														) : (
															<Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900">
																<TrendingDown className="w-3 h-3 mr-1" />
																Saída
															</Badge>
														)}
													</TableCell>
													<TableCell className="font-mono">
														{Number(entry.quantity).toLocaleString('en-US', {
															minimumFractionDigits: unitDisplay.decimals,
															maximumFractionDigits: unitDisplay.decimals
														})} {unitDisplay.abbr}
													</TableCell>
													<TableCell className="text-right">
														{entry.operation === 'add' && entry.purchase_price !== null && entry.purchase_price !== undefined ? (
															<span className="font-semibold text-green-600 dark:text-green-500">
																$ {Number(entry.purchase_price).toLocaleString('en-US', {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2
																})}
															</span>
														) : (
															<span className="text-muted-foreground/50">-</span>
														)}
													</TableCell>
													
												</TableRow>
											)})}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

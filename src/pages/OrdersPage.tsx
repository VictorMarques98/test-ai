import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurantStore, checkOrderFeasibility } from "@/store/restaurantStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Plus,
	ShoppingCart,
	AlertTriangle,
	CheckCircle2,
	X,
	ClipboardList,
	Trash2,
	Filter,
	XCircle,
	ChevronDown,
	ChevronUp,
	Edit,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
	const location = useLocation();
	const { orders, dishes, products, clients, addOrder, updateOrder, confirmOrder, deleteOrder } =
		useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<{ dishId: string; quantity: number }[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(true);
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [filterClient, setFilterClient] = useState<string>("all");
	const [filterOrderId, setFilterOrderId] = useState<string>("");
	const [filterDateFrom, setFilterDateFrom] = useState<string>("");
	const [filterDateTo, setFilterDateTo] = useState<string>("");

	// Handle incoming filter from navigation
	useEffect(() => {
		const state = location.state as { filterOrderId?: string } | null;
		if (state?.filterOrderId) {
			setFilterOrderId(state.filterOrderId);
			setFiltersExpanded(true);
			// Clear the state to avoid re-applying on refresh
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	const addItem = () => {
		if (dishes.length === 0) return;
		setItems([...items, { dishId: dishes[0].id, quantity: 1 }]);
	};

	const updateItem = (idx: number, field: string, value: string | number) => {
		const updated = [...items];
		updated[idx] = { ...updated[idx], [field]: field === "quantity" ? Number(value) : value };
		setItems(updated);
	};

	const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

	const feasibility = useMemo(
		() => (items.length > 0 ? checkOrderFeasibility(items, dishes, products) : null),
		[items, dishes, products],
	);

	const handleSubmit = () => {
		if (items.length === 0) return;
		if (editingOrderId) {
			updateOrder(editingOrderId, items, selectedClientId || undefined, description || undefined);
		} else {
			addOrder(items, selectedClientId || undefined, description || undefined);
		}
		setItems([]);
		setSelectedClientId("");
		setDescription("");
		setEditingOrderId(null);
		setOpen(false);
	};

	const startEditOrder = (order: (typeof orders)[0]) => {
		setItems(order.items);
		setSelectedClientId(order.clientId || "");
		setDescription(order.description || "");
		setEditingOrderId(order.id);
		setOpen(true);
	};

	const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || "Unknown";
	const getClientName = (id?: string) => (id ? clients.find((c) => c.id === id)?.name || "Unknown" : "—");

	const statusColor = (s: string) => {
		if (s === "pending") return "outline";
		if (s === "confirmed") return "default";
		return "outline";
	};

	// Apply filters
	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			// Status filter
			if (filterStatus !== "all" && order.status !== filterStatus) return false;

			// Client filter
			if (filterClient !== "all" && order.clientId !== filterClient) return false;

			// Order ID filter
			if (filterOrderId && !order.id.toLowerCase().includes(filterOrderId.toLowerCase())) return false;

			// Date range filter
			const orderDate = new Date(order.createdAt);
			if (filterDateFrom) {
				const fromDate = new Date(filterDateFrom);
				fromDate.setHours(0, 0, 0, 0);
				if (orderDate < fromDate) return false;
			}
			if (filterDateTo) {
				const toDate = new Date(filterDateTo);
				toDate.setHours(23, 59, 59, 999);
				if (orderDate > toDate) return false;
			}

			return true;
		});
	}, [orders, filterStatus, filterClient, filterOrderId, filterDateFrom, filterDateTo]);

	const sortedOrders = [...filteredOrders].reverse();

	const hasActiveFilters =
		filterStatus !== "all" ||
		filterClient !== "all" ||
		filterOrderId !== "" ||
		filterDateFrom !== "" ||
		filterDateTo !== "";

	const clearFilters = () => {
		setFilterStatus("all");
		setFilterClient("all");
		setFilterOrderId("");
		setFilterDateFrom("");
		setFilterDateTo("");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Pedidos</h1>
					<p className="text-muted-foreground mt-1">
						Acompanhe os pedidos dos clientes e o impacto no estoque
					</p>
				</div>
				<Dialog
					open={open}
					onOpenChange={(v) => {
						setOpen(v);
						if (!v) {
							setItems([]);
							setSelectedClientId("");
							setDescription("");
							setEditingOrderId(null);
						}
					}}>
					<DialogTrigger asChild>
						<Button disabled={dishes.length === 0}>
							<Plus className="w-4 h-4 mr-2" />
							{dishes.length === 0 ? "Adicione os pratos primeiros" : "Novo pedido"}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>{editingOrderId ? "Editar Pedido" : "Novo pedido"}</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 mt-2">
							{clients.length > 0 && (
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Cliente</label>
									<Select value={selectedClientId} onValueChange={setSelectedClientId}>
										<SelectTrigger>
											<SelectValue placeholder="Select a client (optional)" />
										</SelectTrigger>
										<SelectContent>
											{clients.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<div className="space-y-1.5">
								<label className="text-sm font-medium">Descrição (opcional)</label>
								<textarea
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									placeholder="Adicione observações ou instruções especiais..."
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">Items</p>
								<Button variant="outline" size="sm" onClick={addItem}>
									<Plus className="w-3 h-3 mr-1" />
									Adicionar prato
								</Button>
							</div>
							<div className="space-y-2">
								{items.map((item, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<Select value={item.dishId} onValueChange={(v) => updateItem(idx, "dishId", v)}>
											<SelectTrigger className="flex-1">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{dishes.map((d) => (
													<SelectItem key={d.id} value={d.id}>
														{d.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="number"
											className="w-20"
											min={1}
											value={item.quantity}
											onChange={(e) => updateItem(idx, "quantity", e.target.value)}
										/>
										<Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
											<X className="w-3 h-3" />
										</Button>
									</div>
								))}
								{items.length === 0 && (
									<div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
										<AlertTriangle className="w-4 h-4 text-amber-600" />
										<p className="text-sm text-amber-800">Adicione pelo menos um prato ao pedido</p>
									</div>
								)}
							</div>

							{feasibility && feasibility.shortages.length > 0 && (
								<div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
									<div className="flex items-center gap-2 text-destructive font-semibold text-sm">
										<AlertTriangle className="w-4 h-4" /> Inventory Shortage
									</div>
									{feasibility.shortages.map((s, i) => (
										<p key={i} className="text-xs text-destructive/80">
											{s.product.name}: need {s.needed} {s.product.unit}, only {s.available}{" "}
											available
										</p>
									))}
								</div>
							)}

							{feasibility && feasibility.shortages.length === 0 && items.length > 0 && (
								<div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-2 text-sm">
									<CheckCircle2 className="w-4 h-4 text-success" />
									<span className="text-success">Todos ingredientes diponiveis</span>
								</div>
							)}

							<Button className="w-full" onClick={handleSubmit} disabled={items.length === 0}>
								{editingOrderId ? "Atualizar Pedido" : "Place Order"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filters Section */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-2 mb-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setFiltersExpanded(!filtersExpanded)}
							className="h-8 px-2 -ml-2">
							{filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
						</Button>
						<Filter className="w-4 h-4 text-muted-foreground" />
						<h3 className="font-semibold text-sm">Filtros</h3>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 text-xs">
								<XCircle className="w-3 h-3 mr-1" />
								Limpar filtros
							</Button>
						)}
					</div>
					{filtersExpanded && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
							{/* Status Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Status</label>
								<Select value={filterStatus} onValueChange={setFilterStatus}>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										<SelectItem value="pending">Em andamento</SelectItem>
										<SelectItem value="confirmed">Finalizado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Client Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Cliente</label>
								<Select value={filterClient} onValueChange={setFilterClient}>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										{clients.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Order ID Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">ID do Pedido</label>
								<Input
									placeholder="Buscar por ID..."
									value={filterOrderId}
									onChange={(e) => setFilterOrderId(e.target.value)}
									className="h-9"
								/>
							</div>

							{/* Date From Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
								<Input
									type="date"
									value={filterDateFrom}
									onChange={(e) => setFilterDateFrom(e.target.value)}
									className="h-9"
								/>
							</div>

							{/* Date To Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Data Final</label>
								<Input
									type="date"
									value={filterDateTo}
									onChange={(e) => setFilterDateTo(e.target.value)}
									className="h-9"
								/>
							</div>
						</div>
					)}
					<div className="mt-3 text-xs text-muted-foreground">
						Mostrando {sortedOrders.length} de {orders.length} pedidos
					</div>
				</CardContent>
			</Card>

			{sortedOrders.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							{hasActiveFilters
								? "Nenhum pedido encontrado com os filtros aplicados."
								: "Nenhum pedido ainda."}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{sortedOrders.map((o) => (
						<Card key={o.id} className="overflow-hidden">
							<CardContent className="p-0">
								{/* Header Section */}
								<div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
									<div className="flex flex-col gap-1">
										<span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest">
											Pedido #{o.id.slice(0, 8)}
										</span>
										<span className="text-base font-bold text-slate-900 dark:text-slate-100">
											{getClientName(o.clientId)}
										</span>
									</div>
									<div className="flex items-center gap-4">
										<span className="text-sm font-semibold text-slate-800 dark:text-slate-300">
											{new Date(o.createdAt).toLocaleDateString("pt-BR", {
												day: "2-digit",
												month: "short",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
										<Badge
											variant={statusColor(o.status)}
											className={`capitalize font-bold text-xs px-3 py-1 ${
												o.status === "pending"
													? "bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-100"
													: "bg-green-100 text-green-900 border-green-400 hover:bg-green-100"
											}`}>
											{o.status === "pending" ? "Em andamento" : "Finalizado"}
										</Badge>
									</div>
								</div>

								{/* Description Section */}
								{o.description && (
									<div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900">
										<p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
											Descrição
										</p>
										<p className="text-sm text-blue-900 dark:text-blue-200">{o.description}</p>
									</div>
								)}

								{/* Items Section */}
								<div className="p-4 w-80">
									<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
										Itens ({o.items.length})
									</p>
									<div className="space-y-2">
										{o.items.map((item, i) => {
											const dish = dishes.find((d) => d.id === item.dishId);
											return (
												<div
													key={i}
													className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-md">
													<span className="text-sm font-medium">
														{getDishName(item.dishId)}
													</span>
													<span className="text-sm text-muted-foreground">
														× {item.quantity}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								{/* Actions Section */}
								<div className="flex items-center justify-end gap-2 p-4 pt-0">
									{o.status === "pending" && (
										<>
											<Button
												size="sm"
												variant="outline"
												onClick={() => startEditOrder(o)}
												className="bg-blue-50 border-blue-600 text-blue-700 hover:bg-blue-100 hover:border-blue-700 hover:text-blue-800">
												<Edit className="w-3 h-3 mr-1" />
												Editar
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => confirmOrder(o.id)}
												className="bg-green-50 border-green-600 text-green-700 hover:bg-green-100 hover:border-green-700 hover:text-green-800">
												<CheckCircle2 className="w-3 h-3 mr-1" />
												Confirmar
											</Button>
										</>
									)}
									<Button
										size="sm"
										variant="outline"
										onClick={() => deleteOrder(o.id)}
										className="bg-red-50 border-red-600 text-red-700 hover:bg-red-100 hover:border-red-700 hover:text-red-800">
										<Trash2 className="w-3 h-3 mr-1" />
										Excluir
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
	UserPlus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { orders, dishes, products, clients, addOrder, updateOrder, confirmOrder, deleteOrder, addClient } =
		useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [items, setItems] = useState<{ dishId: string; quantity: number; size: "small" | "medium" | "large" }[]>([]);
	const [selectedClientId, setSelectedClientId] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

	// Client form states
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "", description: "" });

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [filterClient, setFilterClient] = useState<string>("all");
	const [filterOrderNumber, setFilterOrderNumber] = useState<string>("");
	const [filterDateFrom, setFilterDateFrom] = useState<string>("");
	const [filterDateTo, setFilterDateTo] = useState<string>("");

	// Handle opening modal from navigation
	useEffect(() => {
		const state = location.state as { openModal?: boolean } | null;
		if (state?.openModal) {
			setOpen(true);
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	// Handle incoming filter from navigation
	useEffect(() => {
		const state = location.state as { filterOrderNumber?: string } | null;
		if (state?.filterOrderNumber) {
			setFilterOrderNumber(state.filterOrderNumber);
			setFiltersExpanded(true);
			// Clear the state to avoid re-applying on refresh
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	const addItem = () => {
		if (dishes.length === 0) return;
		setItems([...items, { dishId: dishes[0].id, quantity: 1, size: "medium" }]);
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

	const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || "Desconhecido";
	const getClientName = (id?: string) => (id ? clients.find((c) => c.id === id)?.name || "Desconhecido" : "—");

	const handleAddClient = () => {
		const data = {
			name: clientForm.name.trim(),
			phone: clientForm.phone.trim(),
			email: clientForm.email.trim(),
			description: clientForm.description.trim(),
		};
		if (!data.name) return;
		const newClientId = addClient(data);
		setSelectedClientId(newClientId);
		setClientForm({ name: "", phone: "", email: "", description: "" });
		setClientModalOpen(false);
	};

	const calculateOrderTotal = (orderItems: typeof items) => {
		return orderItems.reduce((total, item) => {
			const dish = dishes.find((d) => d.id === item.dishId);
			if (!dish) return total;
			const price =
				item.size === "small" ? dish.priceSmall : item.size === "medium" ? dish.priceMedium : dish.priceLarge;
			return total + price * item.quantity;
		}, 0);
	};

	const handleClientClick = (clientId?: string) => {
		if (clientId) {
			navigate("/clients", { state: { filterClientId: clientId } });
		}
	};

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

			// Order Number filter
			if (filterOrderNumber && !order.orderNumber.toString().includes(filterOrderNumber)) return false;

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
	}, [orders, filterStatus, filterClient, filterOrderNumber, filterDateFrom, filterDateTo]);

	const sortedOrders = [...filteredOrders].reverse();

	const hasActiveFilters =
		filterStatus !== "all" ||
		filterClient !== "all" ||
		filterOrderNumber !== "" ||
		filterDateFrom !== "" ||
		filterDateTo !== "";

	const clearFilters = () => {
		setFilterStatus("all");
		setFilterClient("all");
		setFilterOrderNumber("");
		setFilterDateFrom("");
		setFilterDateTo("");
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<ShoppingCart className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Pedidos</h1>
							<p className="text-slate-300 mt-1">
								Acompanhe os pedidos dos clientes e o impacto no estoque
							</p>
						</div>
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
							<Button size="lg" className="shadow-lg" disabled={dishes.length === 0}>
								<Plus className="w-4 h-4 mr-2" />
								{dishes.length === 0 ? "Adicione os pratos primeiros" : "Novo pedido"}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg">
							<DialogHeader>
								<DialogTitle>{editingOrderId ? "Editar Pedido" : "Novo pedido"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium">Cliente</label>
										<Dialog open={clientModalOpen} onOpenChange={setClientModalOpen}>
											<DialogTrigger asChild>
												<Button variant="ghost" size="sm" className="h-7 text-xs">
													<UserPlus className="w-3 h-3 mr-1" />
													Novo Cliente
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Novo Cliente</DialogTitle>
												</DialogHeader>
												<div className="space-y-4 mt-2">
													<div className="space-y-1.5">
														<label className="text-sm font-medium">Nome</label>
														<Input
															placeholder="Nome do cliente"
															value={clientForm.name}
															onChange={(e) =>
																setClientForm({ ...clientForm, name: e.target.value })
															}
														/>
													</div>
													<div className="space-y-1.5">
														<label className="text-sm font-medium">Telefone</label>
														<Input
															placeholder="Telefone"
															value={clientForm.phone}
															onChange={(e) =>
																setClientForm({ ...clientForm, phone: e.target.value })
															}
														/>
													</div>
													<div className="space-y-1.5">
														<label className="text-sm font-medium">Email</label>
														<Input
															placeholder="Email"
															type="email"
															value={clientForm.email}
															onChange={(e) =>
																setClientForm({ ...clientForm, email: e.target.value })
															}
														/>
													</div>
													<div className="space-y-1.5">
														<label className="text-sm font-medium">
															Observação do cliente (opcional)
														</label>
														<textarea
															className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
															placeholder="Adicione notas ou informações sobre o cliente..."
															value={clientForm.description}
															onChange={(e) =>
																setClientForm({
																	...clientForm,
																	description: e.target.value,
																})
															}
														/>
													</div>
													<Button className="w-full" onClick={handleAddClient}>
														Adicionar Cliente
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>
									<Select value={selectedClientId} onValueChange={setSelectedClientId}>
										<SelectTrigger>
											<SelectValue placeholder="Selecione um cliente (opcional)" />
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
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Observaçǎo do pedido (opcional)</label>
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
									{items.length > 0 && (
										<div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2">
											<span className="text-xs font-medium text-muted-foreground">Prato</span>
											<span className="text-xs font-medium text-muted-foreground w-24">
												Tamanho
											</span>
											<span className="text-xs font-medium text-muted-foreground w-20">Qtd</span>
											<span className="w-10"></span>
										</div>
									)}
									{items.map((item, idx) => (
										<div key={idx} className="flex items-center gap-2">
											<Select
												value={item.dishId}
												onValueChange={(v) => updateItem(idx, "dishId", v)}>
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
											<Select value={item.size} onValueChange={(v) => updateItem(idx, "size", v)}>
												<SelectTrigger className="w-24">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="small">P</SelectItem>
													<SelectItem value="medium">M</SelectItem>
													<SelectItem value="large">G</SelectItem>
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
											<p className="text-sm text-amber-800">
												Adicione pelo menos um prato ao pedido
											</p>
										</div>
									)}
								</div>

								{feasibility && feasibility.shortages.length > 0 && (
									<div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
										<div className="flex items-center gap-2 text-destructive font-semibold text-sm">
											<AlertTriangle className="w-4 h-4" /> Falta de Estoque
										</div>
										{feasibility.shortages.map((s, i) => (
											<p key={i} className="text-xs text-destructive/80">
												{s.product.name}: precisa {s.needed} {s.product.unit}, apenas{" "}
												{s.available} disponível
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

								{items.length > 0 && (
									<div className="flex items-center justify-between py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-700">
										<span className="font-semibold text-slate-700 dark:text-slate-300">
											Total do Pedido:
										</span>
										<span className="text-2xl font-bold text-primary">
											${calculateOrderTotal(items).toFixed(2)}
										</span>
									</div>
								)}

								<Button className="w-full" onClick={handleSubmit} disabled={items.length === 0}>
									{editingOrderId ? "Atualizar Pedido" : "Criar Pedido"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
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

							{/* Order Number Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Número do Pedido</label>
								<Input
									placeholder="Buscar por número..."
									value={filterOrderNumber}
									onChange={(e) => setFilterOrderNumber(e.target.value)}
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
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{sortedOrders.map((o) => (
						<Card key={o.id} className="overflow-hidden flex flex-col">
							<CardContent className="p-0 flex flex-col h-full">
								{/* Header Section */}
								<div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
									<div className="flex flex-col gap-1">
										<span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest">
											Pedido #{o.orderNumber}
										</span>
										<button
											onClick={() => handleClientClick(o.clientId)}
											disabled={!o.clientId}
											className={`text-base font-bold text-left ${o.clientId ? "text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors underline decoration-transparent hover:decoration-current" : "text-slate-900 dark:text-slate-100 cursor-default"}`}>
											{getClientName(o.clientId)}
										</button>
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
								<div className="p-4 flex-1">
									<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
										Itens ({o.items.length})
									</p>
									<div className="space-y-2">
										{o.items.map((item, i) => {
											const dish = dishes.find((d) => d.id === item.dishId);
											const price = dish
												? item.size === "small"
													? dish.priceSmall
													: item.size === "medium"
														? dish.priceMedium
														: dish.priceLarge
												: 0;
											return (
												<div
													key={i}
													className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-md">
													<div className="flex flex-col">
														<span className="text-sm font-medium">
															{getDishName(item.dishId)}
														</span>
														<span className="text-xs text-muted-foreground">
															{item.size === "small"
																? "Pequeno"
																: item.size === "medium"
																	? "Médio"
																	: "Grande"}{" "}
															- ${price.toFixed(2)}
														</span>
													</div>
													<span className="text-sm text-muted-foreground">
														× {item.quantity}
													</span>
												</div>
											);
										})}
									</div>
									<div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
										<span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
											Total:
										</span>
										<span className="text-lg font-bold text-primary">
											${calculateOrderTotal(o.items).toFixed(2)}
										</span>
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

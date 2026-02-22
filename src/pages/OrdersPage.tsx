import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { useCustomers } from "@/hooks/useCustomers";
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
	Loader2,
	AlertCircle,
	Printer,
	ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { OrderLabelsTemplate } from "@/components/OrderLabelsTemplate";
import type { Order } from "@/types/api";

export default function OrdersPage() {
	const location = useLocation();
	const navigate = useNavigate();
	const { 
		orders, 
		products,
		isLoading,
		error,
		fetchOrders, 
		fetchProducts,
		createOrder, 
		updateOrderStatus,
		clearError 
	} = useRestaurantStore();
	const { customers, loading: customersLoading } = useCustomers();
	const [open, setOpen] = useState(false);
	const [selectedProducts, setSelectedProducts] = useState<{ productId: string; quantity: number }[]>([]);
	const [customerId, setCustomerId] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [forcedTotal, setForcedTotal] = useState<string>("");
	const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
	const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	// Filter states
	const [filtersExpanded, setFiltersExpanded] = useState(false);
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [filterOrderNumber, setFilterOrderNumber] = useState<string>("");
	const [filterDateFrom, setFilterDateFrom] = useState<string>("");
	const [filterDateTo, setFilterDateTo] = useState<string>("");

	// Print states
	const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
	const printRef = useRef<HTMLDivElement>(null);

	// Print handler
	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle: `Pedido-${orderToPrint?.id.substring(0, 8).toUpperCase()}`,
		onAfterPrint: () => {
			// Only finish the order after printing is complete
			if (orderToPrint) {
				updateOrderStatus(orderToPrint.id, 'finish')
					.then(() => {
						fetchOrders();
						toast.success('Pedido finalizado!');
					})
					.catch((error: any) => {
						toast.error(error.message || 'Falha ao finalizar pedido');
					})
					.finally(() => {
						setOrderToPrint(null);
					});
			}
		},
	});

	// Trigger print when orderToPrint is set
	useEffect(() => {
		if (orderToPrint && printRef.current) {
			handlePrint();
		}
	}, [orderToPrint, handlePrint]);

	// Fetch data on mount
	useEffect(() => {
		Promise.all([
			fetchOrders(),
			fetchProducts()
		]).catch(err => {
			console.error('Failed to load data:', err);
		});
	}, [fetchOrders, fetchProducts]);

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

	// Auto-clear errors after 5 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				clearError();
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const addItem = () => {
		if (products.length === 0) return;
		setSelectedProducts([...selectedProducts, { productId: products[0].id, quantity: 1 }]);
	};

	const updateItem = (idx: number, field: string, value: string | number) => {
		const updated = [...selectedProducts];
		updated[idx] = { ...updated[idx], [field]: field === "quantity" ? Number(value) : value };
		setSelectedProducts(updated);
	};

	const removeItem = (idx: number) => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx));

	const handleSubmit = async () => {
		if (selectedProducts.length === 0) {
			setSubmitMessage({ type: 'error', text: 'Adicione pelo menos um produto ao pedido' });
			return;
		}

		setSubmitMessage(null);

		try {
			// Build products array by repeating product IDs based on quantity
			const productsArray: string[] = [];
			selectedProducts.forEach(item => {
				for (let i = 0; i < item.quantity; i++) {
					productsArray.push(item.productId);
				}
			});

			const data = {
				customerId: customerId && customerId !== "none" ? customerId : undefined,
				forced_total: forcedTotal ? Number(forcedTotal) : undefined,
				notes: notes.trim() || undefined,
				products: productsArray,
			};

			if (editingOrderId) {
				// Backend doesn't support editing orders, so we show a message
				setSubmitMessage({ type: 'error', text: 'Edição de pedidos não suportada pelo backend ainda' });
				return;
			} else {
				await createOrder(data);
				setSubmitMessage({ type: 'success', text: 'Pedido criado com sucesso!' });
				setTimeout(() => {
					setSelectedProducts([]);
					setCustomerId("");
					setNotes("");
					setForcedTotal("");
					setEditingOrderId(null);
					setSubmitMessage(null);
					setOpen(false);
				}, 1500);
			}
		} catch (error: any) {
			setSubmitMessage({ type: 'error', text: error.message || 'Falha ao criar pedido' });
		}
	};

	const getProductName = (id: string) => products.find((p) => p.id === id)?.name || "Desconhecido";
	const getProductPrice = (id: string) => products.find((p) => p.id === id)?.price || 0;

	const calculateOrderTotal = (orderProducts: string[]) => {
		return orderProducts.reduce((total, productId) => {
			const product = products.find((p) => p.id === productId);
			return total + (Number(product?.price) || 0);
		}, 0);
	};

	const getCustomerName = (order: any) => {
		// First check if customer data is embedded in the order
		if (order.customer && order.customer.name) {
			return order.customer.name;
		}
		// Otherwise try to find customer by ID
		const customerId = order.customer_id || order.customerId;
		if (!customerId) return "Cliente não informado";
		const customer = customers.find((c) => c.id === customerId);
		return customer?.name || "Cliente não encontrado";
	};

	const statusColor = (s: string) => {
		if (s === "request") return "outline";
		if (s === "in_progress") return "default";
		if (s === "finish") return "secondary";
		if (s === "refuse" || s === "canceled") return "destructive";
		return "outline";
	};

	const statusLabel = (s: string) => {
		if (s === "request") return "Pendente";
		if (s === "in_progress") return "Em Andamento";
		if (s === "finish") return "Finalizado";
		if (s === "refuse") return "Recusado";
		if (s === "canceled") return "Cancelado";
		return s;
	};

	// Apply filters
	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			// Skip invalid orders
			if (!order || !order.id || !order.status || !order.created_at) return false;
			
			// Status filter
			if (filterStatus !== "all" && order.status !== filterStatus) return false;

			// Order Number filter - search in order ID since backend doesn't have orderNumber
			if (filterOrderNumber && !order.id.includes(filterOrderNumber)) return false;

			// Date range filter
			const orderDate = new Date(order.created_at);
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
	}, [orders, filterStatus, filterOrderNumber, filterDateFrom, filterDateTo]);

	const sortedOrders = [...filteredOrders].reverse();

	const hasActiveFilters =
		filterStatus !== "all" ||
		filterOrderNumber !== "" ||
		filterDateFrom !== "" ||
		filterDateTo !== "";

	const clearFilters = () => {
		setFilterStatus("all");
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
								Acompanhe os pedidos dos clientes, atualize status e gerencie as informações de cada um.
							</p>
						</div>
					</div>
					<Dialog
						open={open}
						onOpenChange={(v) => {
							setOpen(v);
							if (!v) {
								setSelectedProducts([]);
								setCustomerId("");
								setNotes("");
								setForcedTotal("");
								setEditingOrderId(null);
							}
						}}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg" disabled={products.length === 0 || isLoading}>
								<Plus className="w-4 h-4 mr-2" />
								{products.length === 0 ? "Adicione os pratos primeiro" : "Novo pedido"}
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
							<DialogHeader>
								<DialogTitle>{editingOrderId ? "Editar Pedido" : "Novo pedido"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2 overflow-y-auto px-2">
								{submitMessage && (
									<Alert variant={submitMessage.type === 'error' ? 'destructive' : 'default'} className={submitMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : ''}>
										{submitMessage.type === 'error' ? (
											<AlertCircle className="h-4 w-4" />
										) : (
											<CheckCircle2 className="h-4 w-4" />
										)}
										<AlertDescription>{submitMessage.text}</AlertDescription>
									</Alert>
								)}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium">Cliente (opcional)</label>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setOpen(false);
												navigate("/clients", { state: { openModal: true } });
											}}
											className="h-7 text-xs">
											<UserPlus className="w-3 h-3 mr-1" />
											Novo Cliente
										</Button>
									</div>
									<Select value={customerId || "none"} onValueChange={setCustomerId}>
										<SelectTrigger>
											<SelectValue placeholder="Selecione um cliente..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Nenhum cliente</SelectItem>
											{customers.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.name} {c.phone ? `(${c.phone})` : ''}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Observações do pedido (opcional)</label>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Adicione observações ou instruções especiais..."
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Total Customizado (opcional)</label>
									<Input
										type="number"
										placeholder="Ex: 45.50"
										step="0.01"
										min="0"
										value={forcedTotal}
										onChange={(e) => setForcedTotal(e.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										Se informado, este valor será usado ao invés do total calculado
									</p>
								</div>
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium">Produtos *</p>
									<Button variant="outline" size="sm" onClick={addItem}>
										<Plus className="w-3 h-3 mr-1" />
										Adicionar produto
									</Button>
								</div>
								<div className="space-y-2">
									{selectedProducts.length > 0 && (
										<div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2">
											<span className="text-xs font-medium text-muted-foreground">Produto</span>
											<span className="text-xs font-medium text-muted-foreground w-20">Qtd</span>
											<span className="w-10"></span>
										</div>
									)}
									{selectedProducts.map((item, idx) => (
										<div key={idx} className="flex items-center gap-2">
											<Select
												value={item.productId}
												onValueChange={(v) => updateItem(idx, "productId", v)}>
												<SelectTrigger className="flex-1">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{products.map((p) => (
														<SelectItem key={p.id} value={p.id}>
															{p.name} {p.price ? `- $${Number(p.price).toFixed(2)}` : ''}
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
									{selectedProducts.length === 0 && (
										<div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
											<AlertTriangle className="w-4 h-4 text-amber-600" />
											<p className="text-sm text-amber-800">
												Adicione pelo menos um produto ao pedido
											</p>
										</div>
									)}
								</div>

								{selectedProducts.length > 0 && (
									<div className="flex items-center justify-between py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-700">
										<span className="font-semibold text-slate-700 dark:text-slate-300">
											Total Estimado:
										</span>
										<span className="text-2xl font-bold text-primary">
											${(() => {
												const productsArray: string[] = [];
												selectedProducts.forEach(item => {
													for (let i = 0; i < item.quantity; i++) {
														productsArray.push(item.productId);
													}
												});
												return calculateOrderTotal(productsArray).toFixed(2);
											})()}
										</span>
									</div>
								)}

								<Button 
									className="w-full" 
									onClick={handleSubmit} 
									disabled={selectedProducts.length === 0 || isLoading}>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Criando...
										</>
									) : (
										editingOrderId ? "Atualizar Pedido" : "Criar Pedido"
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
										{[filterStatus !== "all", filterOrderNumber !== "", filterDateFrom !== "", filterDateTo !== ""].filter(Boolean).length}
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
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
							{/* Status Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">Status</label>
								<Select value={filterStatus} onValueChange={setFilterStatus}>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										<SelectItem value="request">Pendente</SelectItem>
										<SelectItem value="in_progress">Em Andamento</SelectItem>
										<SelectItem value="finish">Finalizado</SelectItem>
										<SelectItem value="refuse">Recusado</SelectItem>
										<SelectItem value="canceled">Cancelado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Order ID Filter */}
							<div className="space-y-1.5">
								<label className="text-xs font-medium text-muted-foreground">ID do Pedido</label>
								<Input
									placeholder="Buscar por ID..."
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

						{/* Results Count */}
						<div className="text-sm text-muted-foreground">
							Mostrando <span className="font-semibold text-foreground">{sortedOrders.length}</span> de{" "}
							<span className="font-semibold text-foreground">{orders.length}</span> pedidos
						</div>
					</div>
				</CardContent>
			</Card>

			{isLoading && orders.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
						<p className="text-muted-foreground">Carregando pedidos...</p>
					</CardContent>
				</Card>
			) : sortedOrders.length === 0 ? (
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
					{sortedOrders.map((o) => {
						// Skip invalid orders
						if (!o || !o.id) return null;
						
						// Group products by ID to show quantity
						const productMap = new Map<string, { name: string; price: number; quantity: number }>();
						
						// Use products array if available, otherwise fall back to order_items
						if (o.products && o.products.length > 0) {
							(o.products as any[]).forEach((product: any) => {
								const productId = product.id;
								const productName = product.name || "Produto";
								const productPrice = Number(product.price || 0);
								const productQuantity = Number(product.quantity || 1);
								
								if (productMap.has(productId)) {
									const existing = productMap.get(productId)!;
									existing.quantity += productQuantity;
								} else {
									productMap.set(productId, {
										name: productName,
										price: productPrice,
										quantity: productQuantity
									});
								}
							});
						} else if (o.order_items && o.order_items.length > 0) {
							// Fallback to order_items (showing consumed items/ingredients)
							(o.order_items || []).forEach((orderItem) => {
								const itemId = orderItem.item_id;
								const itemName = orderItem.item?.name || "Item";
								
								if (productMap.has(itemId)) {
									const existing = productMap.get(itemId)!;
									existing.quantity += orderItem.quantity;
								} else {
									productMap.set(itemId, {
										name: itemName,
										price: 0, // Items don't have prices
										quantity: orderItem.quantity
									});
								}
							});
						}

						return (
							<Card key={o.id} className="overflow-hidden flex flex-col">
								<CardContent className="p-0 flex flex-col h-full">
									{/* Header Section */}
									<div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
										<div className="flex flex-col gap-1">
											<span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest">
												Pedido #{o.id.slice(0, 8)}
											</span>
											<span className="text-base font-bold text-slate-900 dark:text-slate-100">
											{getCustomerName(o)}
											</span>
										</div>
										<div className="flex items-center gap-4">
											<span className="text-sm font-semibold text-slate-800 dark:text-slate-300">
												{new Date(o.created_at).toLocaleDateString("pt-BR", {
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
													o.status === "request"
														? "bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-100"
														: o.status === "in_progress"
															? "bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-100"
															: o.status === "finish"
																? "bg-green-100 text-green-900 border-green-400 hover:bg-green-100"
																: "bg-red-100 text-red-900 border-red-400 hover:bg-red-100"
												}`}>
												{statusLabel(o.status)}
											</Badge>
										</div>
									</div>

									{/* Notes Section */}
									{o.notes && (
										<div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900">
											<p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">
												Observações
											</p>
											<p className="text-sm text-blue-900 dark:text-blue-200">{o.notes}</p>
										</div>
									)}

									{/* Products Section */}
									<div className="p-4 flex-1">
										<p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
											Produtos ({productMap.size})
										</p>
										<div className="space-y-2.5">
											{Array.from(productMap.entries()).map(([productId, product]) => (
												<div
													key={productId}
													className="py-3 px-4 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors">
													<div className="flex items-center justify-between gap-4">
														<div className="flex items-center gap-3 flex-1">
															<div className="flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-md bg-primary/10 text-primary font-bold text-sm">
																{product.quantity}×
															</div>
															<span className="text-sm font-semibold text-foreground">
																{product.name}
															</span>
														</div>
														{product.price > 0 && (
															<div className="flex items-center gap-3 text-sm">
																<span className="text-foreground font-bold">
																	${(product.price * product.quantity).toFixed(2)}
																</span>
															</div>
														)}
													</div>
												</div>
											))}
										</div>
										<div className="mt-4 pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex items-center justify-between">
											<span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
												Total:
											</span>
											<span className="text-xl font-bold text-primary">
												${Array.from(productMap.values()).reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
											</span>
										</div>
									</div>

									{/* Actions Section */}
									<div className="flex items-center justify-end gap-2 p-4 pt-0">
										{o.status === "request" && (
											<>
												<Button
													size="sm"
													variant="outline"
													onClick={async () => {
														try {
															await updateOrderStatus(o.id, 'in_progress');
															await fetchOrders();
															toast.success('Pedido iniciado!');
														} catch (error: any) {
															toast.error(error.message || 'Falha ao atualizar pedido');
														}
													}}
													className="bg-blue-50 border-blue-600 text-blue-700 hover:bg-blue-100 hover:border-blue-700 hover:text-blue-800">
													<CheckCircle2 className="w-3 h-3 mr-1" />
													Iniciar
												</Button>
											</>
										)}
										{o.status === "in_progress" && (
											<>
												<Button
													size="sm"
													variant="outline"
												onClick={() => {
													// Set order to print, which will trigger the print dialog
													setOrderToPrint(o);
												}}
												className="bg-green-50 border-green-600 text-green-700 hover:bg-green-100 hover:border-green-700 hover:text-green-800">
												<Printer className="w-3 h-3 mr-1" />
												Finalizar e Imprimir
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={async () => {
														try {
															await updateOrderStatus(o.id, 'canceled');
															await fetchOrders();
															toast.success('Pedido cancelado!');
														} catch (error: any) {
															toast.error(error.message || 'Falha ao cancelar pedido');
														}
													}}
													className="bg-orange-50 border-orange-600 text-orange-700 hover:bg-orange-100 hover:border-orange-700 hover:text-orange-800">
													<X className="w-3 h-3 mr-1" />
													Cancelar
												</Button>
											</>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

		{/* Hidden printable component */}
		<div>
			{orderToPrint && (
				<OrderLabelsTemplate
					ref={printRef}
					order={orderToPrint}
					customerName={getCustomerName(orderToPrint)}
				/>
			)}
		</div>
	</div>
	);
}

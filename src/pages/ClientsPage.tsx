import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStore";
import { useCustomers } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, Users, Search, ShoppingBag, Clock, CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientsPage() {
	const location = useLocation();
	const { orders, dishes } = useRestaurantStore();
	const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
	const [search, setSearch] = useState("");
	const [submitting, setSubmitting] = useState(false);

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
		const state = location.state as { filterClientId?: string } | null;
		if (state?.filterClientId) {
			const client = customers.find((c) => c.id === state.filterClientId);
			if (client) {
				setSearch(client.name);
			}
			// Clear the state to avoid re-applying on refresh
			window.history.replaceState({}, document.title);
		}
	}, [location.state, customers]);

	const resetForm = () => {
		setForm({ name: "", phone: "", email: "", address: "" });
		setEditId(null);
	};

	const handleSubmit = async () => {
		const data = {
			name: form.name.trim(),
			phone: form.phone.trim() || null,
			email: form.email.trim() || null,
			address: form.address.trim() || null,
		};
		if (!data.name) return;

		setSubmitting(true);
		try {
			if (editId) {
				await updateCustomer(editId, data);
			} else {
				await createCustomer(data);
			}
			resetForm();
			setOpen(false);
		} finally {
			setSubmitting(false);
		}
	};

	const startEdit = (c: (typeof customers)[0]) => {
		setEditId(c.id);
		setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "" });
		setOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Tem certeza que deseja remover este cliente?")) {
			await deleteCustomer(id);
		}
	};

	const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || "Desconhecido";

	const filteredCustomers = useMemo(() => {
		const q = search.toLowerCase();
		if (!q) return customers;
		return customers.filter(
			(c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q)),
		);
	}, [customers, search]);

	const getClientOrders = (customerId: string) => orders.filter((o) => o.customerId === customerId);

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<Users className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Clientes</h1>
							<p className="text-slate-300 mt-1">Gerencie clientes e visualize seus pedidos</p>
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
								Adicionar Cliente
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<Input
									placeholder="Nome do cliente"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
								<Input
									placeholder="Telefone"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
								/>
								<Input
									placeholder="Email"
									type="email"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
								/>
								<div className="space-y-1.5">
								<label className="text-sm font-medium">Endereço (opcional)</label>
								<textarea
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									placeholder="Endereço de entrega ou localização..."
									value={form.address}
									onChange={(e) => setForm({ ...form, address: e.target.value })}
								/>
							</div>
							<Button className="w-full" onClick={handleSubmit} disabled={submitting || !form.name.trim()}>
								{submitting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										{editId ? "Atualizando..." : "Criando..."}
									</>
								) : (
									<>{editId ? "Atualizar" : "Adicionar Cliente"}</>
								)}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					placeholder="Pesquise clientes por nome, telefone ou e-mail..."
					className={search ? "pl-10 pr-10" : "pl-10"}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				{search && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setSearch("")}
						className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent">
						<X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
					</Button>
				)}
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Loading State */}
			{loading ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
						<p className="text-muted-foreground">Carregando clientes...</p>
					</CardContent>
				</Card>
			) : filteredCustomers.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Users className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							{search
								? "Nenhum cliente corresponde à sua busca."
								: "Nenhum cliente ainda. Adicione seu primeiro cliente."}
						</p>
					</CardContent>
				</Card>
			) : (
				filteredCustomers.map((c) => {
					const clientOrders = getClientOrders(c.id);
					const pendingOrders = clientOrders.filter((o) => o.status === "request" || o.status === "in_progress").length;
					const confirmedOrders = clientOrders.filter((o) => o.status === "finish").length;
					const lastOrderDate =
						clientOrders.length > 0
							? new Date(Math.max(...clientOrders.map((o) => new Date(o.created_at).getTime())))
							: null;

					return (
						<Card key={c.id} className="overflow-hidden">
							<CardContent className="p-0">
								{/* Client Header Section */}
								<div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 border-b-2 border-blue-200 dark:border-blue-800">
									<div className="flex-1">
										<p className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
											{c.name}
										</p>
										<div className="flex flex-wrap gap-3 text-sm text-blue-700 dark:text-blue-300">
											{c.phone && <span className="flex items-center gap-1">📞 {c.phone}</span>}
											{c.email && <span className="flex items-center gap-1">✉️ {c.email}</span>}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => startEdit(c)}
											className="hover:bg-blue-200 dark:hover:bg-blue-800">
											<Pencil className="w-4 h-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
										onClick={() => handleDelete(c.id)}
											className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600">
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>

{/* Address Section */}
							{c.address && (
								<div className="px-5 py-3 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900">
									<p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">
										Endereço
									</p>
									<p className="text-sm text-purple-900 dark:text-purple-200">{c.address}</p>
									</div>
								)}

								{/* Statistics Section */}
								<div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 border-b">
									<div className="text-center">
										<div className="flex items-center justify-center gap-2 mb-1">
											<ShoppingBag className="w-4 h-4 text-slate-600 dark:text-slate-400" />
											<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
												{clientOrders.length}
											</p>
										</div>
										<p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
											Total de Pedidos
										</p>
									</div>
									<div className="text-center border-x border-slate-200 dark:border-slate-700">
										<div className="flex items-center justify-center gap-2 mb-1">
											<Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
											<p className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">
												{pendingOrders}
											</p>
										</div>
										<p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
											Em Andamento
										</p>
									</div>
									<div className="text-center">
										<div className="flex items-center justify-center gap-2 mb-1">
											<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
											<p className="text-2xl font-bold text-green-700 dark:text-green-500">
												{confirmedOrders}
											</p>
										</div>
										<p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wide">
											Finalizados
										</p>
									</div>
								</div>

								{/* Orders Section */}
								<div className="p-5">
									{clientOrders.length > 0 ? (
										<div>
											<div className="flex items-center justify-between mb-3">
												<h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
													Histórico de Pedidos
												</h3>
												{lastOrderDate && (
													<span className="text-xs text-slate-500 dark:text-slate-400">
														Último pedido: {lastOrderDate.toLocaleDateString("pt-BR")}
													</span>
												)}
											</div>
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
												<Table>
													<TableHeader>
														<TableRow className="bg-slate-100 dark:bg-slate-800">
															<TableHead className="font-semibold">Pedido #</TableHead>
															<TableHead className="font-semibold">Itens</TableHead>
															<TableHead className="font-semibold">Data</TableHead>
															<TableHead className="font-semibold">Status</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{clientOrders.map((o) => (
															<TableRow
																key={o.id}
																className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
																<TableCell className="font-mono text-xs font-semibold">
																	#{o.id.slice(0, 8)}
																</TableCell>
																<TableCell>
																	<div className="flex flex-wrap gap-1">
																		{o.order_items && o.order_items.length > 0 ? (
																			o.order_items.map((item, i) => (
																				<span
																					key={i}
																					className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
																					{item.item?.name || "Item"} ×{item.quantity}
																				</span>
																			))
																		) : (
																			<span className="text-xs text-slate-500">Sem itens</span>
																		)}
																	</div>
																</TableCell>
																<TableCell className="text-xs text-slate-600 dark:text-slate-400">
																	{new Date(o.created_at).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "short",
																		year: "numeric",
																	})}
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			o.status === "request" || o.status === "in_progress"
																				? "outline"
																				: "default"
																		}
																		className={`capitalize font-bold text-xs ${
																			o.status === "request" || o.status === "in_progress"
																				? "bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-100"
																				: o.status === "finish"
																				? "bg-green-100 text-green-900 border-green-400 hover:bg-green-100"
																				: "bg-red-100 text-red-900 border-red-400 hover:bg-red-100"
																		}`}>
																		{o.status === "request"
																			? "Solicitado"
																			: o.status === "in_progress"
																			? "Em Andamento"
																			: o.status === "finish"
																			? "Finalizado"
																			: o.status === "canceled"
																			? "Cancelado"
																			: "Recusado"}
																	</Badge>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>
									) : (
										<div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
											<ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
											<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
												Nenhum pedido ainda
											</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})
			)}
		</div>
	);
}

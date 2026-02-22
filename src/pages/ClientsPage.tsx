import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCustomers } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, Users, Search, ShoppingBag, Clock, CheckCircle2, X, Loader2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

export default function ClientsPage() {
	const location = useLocation();
	const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
	const [search, setSearch] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

	const toggleRow = (id: string) => {
		const newExpanded = new Set(expandedRows);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedRows(newExpanded);
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
				const success = await updateCustomer(editId, data);
				if (success) {
					showSuccessToast('Cliente atualizado com sucesso!');
					resetForm();
					setOpen(false);
				}
			} else {
				const result = await createCustomer(data);
				if (result) {
					showSuccessToast('Cliente criado com sucesso!');
					resetForm();
					setOpen(false);
				}
			}
		} catch (error: any) {
			showErrorToast(error.message || 'Erro ao salvar cliente');
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
			const success = await deleteCustomer(id);
			if (success) {
				showSuccessToast('Cliente removido com sucesso!');
			} else {
				showErrorToast('Erro ao remover cliente');
			}
		}
	};

	const filteredCustomers = useMemo(() => {
		const q = search.toLowerCase();
		if (!q) return customers;
		return customers.filter(
			(c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q)),
		);
	}, [customers, search]);

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
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-100 dark:bg-slate-800">
									<TableHead className="w-[50px]"></TableHead>
									<TableHead className="font-semibold">Nome</TableHead>
									<TableHead className="font-semibold">Telefone</TableHead>
									<TableHead className="font-semibold">Email</TableHead>
									<TableHead className="font-semibold text-center">Total</TableHead>
									<TableHead className="font-semibold text-center">Em Andamento</TableHead>
									<TableHead className="font-semibold text-center">Finalizados</TableHead>
									<TableHead className="font-semibold text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCustomers.map((c) => {
									const isExpanded = expandedRows.has(c.id);
									const orderCount = c.order_count ?? 0;
									const orderInProgressCount = c.order_in_progress_count ?? 0;
									const orderFinishCount = c.order_finish_count ?? 0;
									const customerOrders = c.orders ?? [];

									return (
										<>
											<TableRow key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
												<TableCell>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => toggleRow(c.id)}
														className="h-8 w-8">
														{isExpanded ? (
															<ChevronDown className="w-4 h-4" />
														) : (
															<ChevronRight className="w-4 h-4" />
														)}
													</Button>
												</TableCell>
												<TableCell className="font-semibold">{c.name}</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{c.phone || <span className="text-slate-400">—</span>}
												</TableCell>
												<TableCell className="text-sm text-muted-foreground">
													{c.email || <span className="text-slate-400">—</span>}
												</TableCell>
												<TableCell className="text-center">
													<Badge variant="outline" className="font-bold">
														<ShoppingBag className="w-3 h-3 mr-1" />
														{orderCount}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<Badge 
														variant="outline" 
														className="font-bold bg-yellow-50 text-yellow-700 border-yellow-400 hover:bg-yellow-50">
														<Clock className="w-3 h-3 mr-1" />
														{orderInProgressCount}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<Badge 
														variant="outline" 
														className="font-bold bg-green-50 text-green-700 border-green-400 hover:bg-green-50">
														<CheckCircle2 className="w-3 h-3 mr-1" />
														{orderFinishCount}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => startEdit(c)}
															className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900">
															<Pencil className="w-4 h-4" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDelete(c.id)}
															className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600">
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
											{isExpanded && (
												<TableRow key={`${c.id}-details`} className="bg-slate-50 dark:bg-slate-900/50">
													<TableCell colSpan={8} className="p-6">
														<div className="space-y-4">
															{/* Address Section */}
															{c.address && (
																<div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900">
																	<p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">
																		Endereço
																	</p>
																	<p className="text-sm text-purple-900 dark:text-purple-200">{c.address}</p>
																</div>
															)}
															
															{/* Dates Section */}
															<div className="grid grid-cols-2 gap-4">
																<div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
																	<p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
																		Cliente desde
																	</p>
																	<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
																		{new Date(c.created_at).toLocaleDateString("pt-BR", {
																			day: "2-digit",
																			month: "long",
																			year: "numeric",
																		})}
																	</p>
																</div>
																<div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
																	<p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
																		Última atualização
																	</p>
																	<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
																		{new Date(c.updated_at).toLocaleDateString("pt-BR", {
																			day: "2-digit",
																			month: "long",
																			year: "numeric",
																		})}
																	</p>
																</div>
															</div>

															{/* Orders Section */}
															{customerOrders.length > 0 ? (
																<div>
																	<h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
																		Histórico de Pedidos ({customerOrders.length})
																	</h4>
																	<div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
																		<Table>
																			<TableHeader>
																				<TableRow className="bg-slate-100 dark:bg-slate-800">
																					<TableHead className="font-semibold">Pedido #</TableHead>
																					<TableHead className="font-semibold">Produtos</TableHead>
																					<TableHead className="font-semibold">Total</TableHead>
																					<TableHead className="font-semibold">Data</TableHead>
																					<TableHead className="font-semibold">Status</TableHead>
																				</TableRow>
																			</TableHeader>
																			<TableBody>
																				{customerOrders.map((order: any) => (
																					<TableRow
																						key={order.id}
																						className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
																						<TableCell className="font-mono text-xs font-semibold">
																							#{order.id.slice(0, 8)}
																						</TableCell>
																						<TableCell>
																							<div className="flex flex-wrap gap-1">
																								{order.products && order.products.length > 0 ? (
																									order.products.map((product: any, i: number) => (
																										<span
																											key={i}
																											className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
																											{product.name || "Produto"} ×{product.quantity || 1}
																										</span>
																									))
																								) : (
																									<span className="text-xs text-slate-500">Sem produtos</span>
																								)}
																							</div>
																						</TableCell>
																						<TableCell className="font-semibold">
																							${Number(order.forced_total || order.total || 0).toFixed(2)}
																						</TableCell>
																						<TableCell className="text-xs text-slate-600 dark:text-slate-400">
																							{new Date(order.created_at).toLocaleDateString("pt-BR", {
																								day: "2-digit",
																								month: "short",
																								year: "numeric",
																								hour: "2-digit",
																								minute: "2-digit",
																							})}
																						</TableCell>
																						<TableCell>
																							<Badge
																								variant={
																									order.status === "request" || order.status === "in_progress"
																										? "outline"
																										: "default"
																								}
																								className={`capitalize font-bold text-xs ${
																									order.status === "request"
																										? "bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-100"
																										: order.status === "in_progress"
																										? "bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-100"
																										: order.status === "finish"
																										? "bg-green-100 text-green-900 border-green-400 hover:bg-green-100"
																										: "bg-red-100 text-red-900 border-red-400 hover:bg-red-100"
																								}`}>
																								{order.status === "request"
																									? "Pendente"
																									: order.status === "in_progress"
																									? "Em Andamento"
																									: order.status === "finish"
																									? "Finalizado"
																									: order.status === "canceled"
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
																<div className="text-center py-8 bg-slate-100 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
																	<ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
																	<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
																		Nenhum pedido ainda
																	</p>
																</div>
															)}
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

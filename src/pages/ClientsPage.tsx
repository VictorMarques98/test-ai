import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, Users, Search, ShoppingBag, Clock, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ClientsPage() {
	const location = useLocation();
	const { clients, orders, dishes, addClient, updateClient, deleteClient } = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ name: "", phone: "", email: "", description: "" });
	const [search, setSearch] = useState("");

	// Handle incoming filter from navigation
	useEffect(() => {
		const state = location.state as { filterClientId?: string } | null;
		if (state?.filterClientId) {
			const client = clients.find((c) => c.id === state.filterClientId);
			if (client) {
				setSearch(client.name);
			}
			// Clear the state to avoid re-applying on refresh
			window.history.replaceState({}, document.title);
		}
	}, [location.state, clients]);

	const resetForm = () => {
		setForm({ name: "", phone: "", email: "", description: "" });
		setEditId(null);
	};

	const handleSubmit = () => {
		const data = {
			name: form.name.trim(),
			phone: form.phone.trim(),
			email: form.email.trim(),
			description: form.description.trim(),
		};
		if (!data.name) return;
		if (editId) {
			updateClient(editId, data);
		} else {
			addClient(data);
		}
		resetForm();
		setOpen(false);
	};

	const startEdit = (c: (typeof clients)[0]) => {
		setEditId(c.id);
		setForm({ name: c.name, phone: c.phone, email: c.email, description: c.description || "" });
		setOpen(true);
	};

	const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name || "Unknown";

	const filteredClients = useMemo(() => {
		const q = search.toLowerCase();
		if (!q) return clients;
		return clients.filter(
			(c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q),
		);
	}, [clients, search]);

	const getClientOrders = (clientId: string) => orders.filter((o) => o.clientId === clientId);

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
									<label className="text-sm font-medium">Descrição (opcional)</label>
									<textarea
										className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Adicione notas ou informações sobre o cliente..."
										value={form.description}
										onChange={(e) => setForm({ ...form, description: e.target.value })}
									/>
								</div>
								<Button className="w-full" onClick={handleSubmit}>
									{editId ? "Atualizar" : "Adicionar Cliente"}
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

			{filteredClients.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Users className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							{search ? "No clients match your search." : "No clients yet. Add your first client."}
						</p>
					</CardContent>
				</Card>
			) : (
				filteredClients.map((c) => {
					const clientOrders = getClientOrders(c.id);
					const pendingOrders = clientOrders.filter((o) => o.status === "pending").length;
					const confirmedOrders = clientOrders.filter((o) => o.status === "confirmed").length;
					const lastOrderDate =
						clientOrders.length > 0
							? new Date(Math.max(...clientOrders.map((o) => new Date(o.createdAt).getTime())))
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
											onClick={() => deleteClient(c.id)}
											className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600">
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>

								{/* Description Section */}
								{c.description && (
									<div className="px-5 py-3 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-900">
										<p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wide">
											Descrição
										</p>
										<p className="text-sm text-purple-900 dark:text-purple-200">{c.description}</p>
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
															<TableHead className="font-semibold">Items</TableHead>
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
																		{o.items.map((item, i) => (
																			<span
																				key={i}
																				className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
																				{getDishName(item.dishId)} ×
																				{item.quantity}
																			</span>
																		))}
																	</div>
																</TableCell>
																<TableCell className="text-xs text-slate-600 dark:text-slate-400">
																	{new Date(o.createdAt).toLocaleDateString("pt-BR", {
																		day: "2-digit",
																		month: "short",
																		year: "numeric",
																	})}
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			o.status === "pending"
																				? "outline"
																				: "default"
																		}
																		className={`capitalize font-bold text-xs ${
																			o.status === "pending"
																				? "bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-100"
																				: "bg-green-100 text-green-900 border-green-400 hover:bg-green-100"
																		}`}>
																		{o.status === "pending"
																			? "Em andamento"
																			: "Finalizado"}
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

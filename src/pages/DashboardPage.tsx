import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Package, UtensilsCrossed, ClipboardList, AlertTriangle, ArrowRight, Plus, Users } from "lucide-react";

export default function DashboardPage() {
	const navigate = useNavigate();
	const { products, orders, fetchProducts, fetchOrders } = useRestaurantStore();
	const pendingOrders = orders.filter((o) => o.status === "request" || o.status === "in_progress");

	// Fetch data on mount
	useEffect(() => {
		Promise.all([
			fetchProducts(),
			fetchOrders()
		]).catch(err => {
			console.error('Failed to load dashboard data:', err);
		});
	}, [fetchProducts, fetchOrders]);

	const stats = [
		{ label: "Produtos", value: products.length, icon: Package, color: "text-primary" },
		{ label: "Pedidos", value: orders.length, icon: ClipboardList, color: "text-primary" },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Bem vindo!</h1>
				<p className="text-muted-foreground mt-1">Visão geral</p>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((s) => (
					<Card key={s.label}>
						<CardContent className="pt-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">{s.label}</p>
									<p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
								</div>
								<s.icon className={`w-8 h-8 ${s.color} opacity-60`} />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Plus className="w-5 h-5 text-primary" /> Atalhos Rápidos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
						<Button
							variant="outline"
							className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary hover:text-primary"
							onClick={() => navigate("/orders", { state: { openModal: true } })}>
							<ClipboardList className="w-6 h-6" />
							<span className="text-sm font-medium">Novo Pedido</span>
						</Button>
						<Button
							variant="outline"
							className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary hover:text-primary"
							onClick={() => navigate("/inventory", { state: { openModal: true } })}>
							<Package className="w-6 h-6" />
							<span className="text-sm font-medium">Novo Produto</span>
						</Button>
						<Button
							variant="outline"
							className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary hover:text-primary"
							onClick={() => navigate("/clients", { state: { openModal: true } })}>
							<Users className="w-6 h-6" />
							<span className="text-sm font-medium">Novo Cliente</span>
						</Button>

					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ClipboardList className="w-7 h-7 text-primary" /> Pedidos em andamento ({pendingOrders.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{pendingOrders.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID do Pedido</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Data de Criação</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingOrders.map((o) => (
									<TableRow key={o.id}>
										<TableCell className="font-mono">#{o.id.slice(0, 8)}</TableCell>
										<TableCell>
											<span className={`text-xs font-medium px-2 py-1 rounded-full ${
												o.status === "request" 
													? "bg-yellow-100 text-yellow-800" 
													: "bg-blue-100 text-blue-800"
											}`}>
												{o.status === "request" ? "Pendente" : "Em Andamento"}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground">
											{new Date(o.created_at).toLocaleDateString("pt-BR", {
												day: "2-digit",
												month: "short",
												year: "numeric"
											})}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													navigate("/orders", {
														state: { filterOrderNumber: o.id.slice(0, 8) },
													})
												}
												className="gap-1">
												Ver detalhes
												<ArrowRight className="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-3" />
							<p className="text-muted-foreground">Nenhum pedido em andamento</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

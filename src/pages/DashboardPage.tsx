import { useNavigate } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Package, UtensilsCrossed, ClipboardList, AlertTriangle, ArrowRight } from "lucide-react";

export default function DashboardPage() {
	const navigate = useNavigate();
	const { products, dishes, orders } = useRestaurantStore();
	const pendingOrders = orders.filter((o) => o.status === "pending");

	const stats = [
		{ label: "Estoque", value: products.length, icon: Package, color: "text-primary" },
		{ label: "Cardapio", value: dishes.length, icon: UtensilsCrossed, color: "text-primary" },
		{ label: "Pedidos", value: orders.length, icon: ClipboardList, color: "text-primary" },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Painel</h1>
				<p className="text-muted-foreground mt-1">Visão geral do restaurante</p>
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

			{pendingOrders.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ClipboardList className="w-7 h-7 text-primary" /> Pedidos em andamento (
							{pendingOrders.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID do Pedido</TableHead>
									<TableHead>Data de Criação</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingOrders.map((o) => (
									<TableRow key={o.id}>
										<TableCell className="font-mono">#{o.id.slice(0, 6)}</TableCell>
										<TableCell className="text-muted-foreground">
											{new Date(o.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => navigate("/orders", { state: { filterOrderId: o.id } })}
												className="gap-1">
												Ver detalhes
												<ArrowRight className="w-4 h-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

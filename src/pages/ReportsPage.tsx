import { useMemo, useState, useEffect } from "react";
import { useRestaurantStore } from "@/store/restaurantStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DollarSign,
	TrendingUp,
	ShoppingCart,
	Users,
	UtensilsCrossed,
	Package,
	BarChart3,
	Calendar,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

export default function ReportsPage() {
	const { orders, dishes, clients, products } = useRestaurantStore();

	// Get current month/year as default
	const currentDate = new Date();
	const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
	const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

	// Get available months from orders
	const availableMonths = useMemo(() => {
		const months = new Set<string>();
		orders.forEach((order) => {
			const date = new Date(order.createdAt);
			months.add(`${date.getFullYear()}-${date.getMonth()}`);
		});
		return Array.from(months)
			.sort()
			.reverse()
			.map((m) => {
				const [year, month] = m.split("-").map(Number);
				return { year, month };
			});
	}, [orders]);

	// Set default to most recent month with data if available
	useEffect(() => {
		if (availableMonths.length > 0 && orders.length > 0) {
			const mostRecent = availableMonths[0];
			setSelectedMonth(mostRecent.month);
			setSelectedYear(mostRecent.year);
		}
	}, []);

	// Filter orders by selected month
	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			const orderDate = new Date(order.createdAt);
			return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
		});
	}, [orders, selectedMonth, selectedYear]);

	// Navigation functions
	const goToPreviousMonth = () => {
		if (selectedMonth === 0) {
			setSelectedMonth(11);
			setSelectedYear(selectedYear - 1);
		} else {
			setSelectedMonth(selectedMonth - 1);
		}
	};

	const goToNextMonth = () => {
		if (selectedMonth === 11) {
			setSelectedMonth(0);
			setSelectedYear(selectedYear + 1);
		} else {
			setSelectedMonth(selectedMonth + 1);
		}
	};

	const goToCurrentMonth = () => {
		const now = new Date();
		setSelectedMonth(now.getMonth());
		setSelectedYear(now.getFullYear());
	};

	// Format month display
	const monthNames = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];
	const selectedMonthName = `${monthNames[selectedMonth]} ${selectedYear}`;
	const isCurrentMonth = selectedMonth === currentDate.getMonth() && selectedYear === currentDate.getFullYear();

	// Calculate total revenue (only confirmed orders)
	const totalRevenue = useMemo(() => {
		return filteredOrders
			.filter((o) => o.status === "confirmed")
			.reduce((sum, order) => {
				return (
					sum +
					order.items.reduce((itemSum, item) => {
						const dish = dishes.find((d) => d.id === item.dishId);
						if (!dish) return itemSum;
						const price =
							item.size === "small"
								? dish.priceSmall
								: item.size === "medium"
									? dish.priceMedium
									: dish.priceLarge;
						return itemSum + price * item.quantity;
					}, 0)
				);
			}, 0);
	}, [filteredOrders, dishes]);

	// Calculate average order value
	const confirmedOrders = filteredOrders.filter((o) => o.status === "confirmed");
	const averageOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

	// Calculate total product costs for confirmed orders in the month
	const totalProductCosts = useMemo(() => {
		let totalCost = 0;

		filteredOrders
			.filter((o) => o.status === "confirmed")
			.forEach((order) => {
				order.items.forEach((item) => {
					const dish = dishes.find((d) => d.id === item.dishId);
					if (!dish) return;

					// Calculate cost for each ingredient in the dish
					dish.ingredients.forEach((ingredient) => {
						const product = products.find((p) => p.id === ingredient.productId);
						if (product && product.buyPrice) {
							// Cost = buy price × ingredient quantity × order quantity
							totalCost += product.buyPrice * ingredient.quantity * item.quantity;
						}
					});
				});
			});

		return totalCost;
	}, [filteredOrders, dishes, products]);

	// Calculate orders by status
	const ordersByStatus = useMemo(() => {
		const pending = filteredOrders.filter((o) => o.status === "pending").length;
		const confirmed = filteredOrders.filter((o) => o.status === "confirmed").length;
		return { pending, confirmed, total: filteredOrders.length };
	}, [filteredOrders]);

	// Calculate most popular dishes
	const dishPopularity = useMemo(() => {
		const dishCount: Record<string, { count: number; revenue: number }> = {};

		filteredOrders
			.filter((o) => o.status === "confirmed")
			.forEach((order) => {
				order.items.forEach((item) => {
					const dish = dishes.find((d) => d.id === item.dishId);
					if (!dish) return;

					const price =
						item.size === "small"
							? dish.priceSmall
							: item.size === "medium"
								? dish.priceMedium
								: dish.priceLarge;

					if (!dishCount[item.dishId]) {
						dishCount[item.dishId] = { count: 0, revenue: 0 };
					}
					dishCount[item.dishId].count += item.quantity;
					dishCount[item.dishId].revenue += price * item.quantity;
				});
			});

		return Object.entries(dishCount)
			.map(([dishId, data]) => ({
				dish: dishes.find((d) => d.id === dishId),
				count: data.count,
				revenue: data.revenue,
			}))
			.filter((item) => item.dish)
			.sort((a, b) => b.count - a.count);
	}, [filteredOrders, dishes]);

	// Calculate top clients by revenue
	const topClients = useMemo(() => {
		const clientRevenue: Record<string, number> = {};

		filteredOrders
			.filter((o) => o.status === "confirmed" && o.clientId)
			.forEach((order) => {
				const revenue = order.items.reduce((sum, item) => {
					const dish = dishes.find((d) => d.id === item.dishId);
					if (!dish) return sum;
					const price =
						item.size === "small"
							? dish.priceSmall
							: item.size === "medium"
								? dish.priceMedium
								: dish.priceLarge;
					return sum + price * item.quantity;
				}, 0);

				if (!clientRevenue[order.clientId!]) {
					clientRevenue[order.clientId!] = 0;
				}
				clientRevenue[order.clientId!] += revenue;
			});

		return Object.entries(clientRevenue)
			.map(([clientId, revenue]) => ({
				client: clients.find((c) => c.id === clientId),
				revenue,
				orders: filteredOrders.filter((o) => o.clientId === clientId && o.status === "confirmed").length,
			}))
			.filter((item) => item.client)
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 5);
	}, [filteredOrders, clients, dishes]);

	// Calculate inventory metrics
	const inventoryMetrics = useMemo(() => {
		const lowStock = products.filter((p) => p.quantity <= p.minStock).length;
		const criticalStock = products.filter((p) => p.quantity < p.minStock * 0.5).length;
		const totalValue = products.reduce((sum, p) => sum + p.quantity, 0);
		return { lowStock, criticalStock, totalValue, totalProducts: products.length };
	}, [products]);

	// Calculate average items per order
	const averageItemsPerOrder = useMemo(() => {
		if (confirmedOrders.length === 0) return 0;
		const totalItems = confirmedOrders.reduce((sum, order) => {
			return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
		}, 0);
		return totalItems / confirmedOrders.length;
	}, [confirmedOrders]);

	const kpiCards = [
		{
			label: "Receita Total",
			value: `$${totalRevenue.toFixed(2)}`,
			icon: DollarSign,
			color: "text-green-600",
			bgColor: "bg-green-50 dark:bg-green-950/30",
		},
		{
			label: "Custo de Produtos",
			value: `$${totalProductCosts.toFixed(2)}`,
			icon: Package,
			color: "text-red-600",
			bgColor: "bg-red-50 dark:bg-red-950/30",
			subtitle: "Gasto em ingredientes",
		},
		{
			label: "Lucro Bruto",
			value: `$${(totalRevenue - totalProductCosts).toFixed(2)}`,
			icon: TrendingUp,
			color: totalRevenue - totalProductCosts >= 0 ? "text-emerald-600" : "text-red-600",
			bgColor:
				totalRevenue - totalProductCosts >= 0
					? "bg-emerald-50 dark:bg-emerald-950/30"
					: "bg-red-50 dark:bg-red-950/30",
			subtitle: `${totalProductCosts > 0 ? (((totalRevenue - totalProductCosts) / totalRevenue) * 100).toFixed(1) : 0}% margem`,
		},
		{
			label: "Valor Médio do Pedido",
			value: `$${averageOrderValue.toFixed(2)}`,
			icon: ShoppingCart,
			color: "text-blue-600",
			bgColor: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			label: "Pedidos Finalizados",
			value: confirmedOrders.length,
			icon: ShoppingCart,
			color: "text-purple-600",
			bgColor: "bg-purple-50 dark:bg-purple-950/30",
		},
		{
			label: "Clientes Ativos",
			value: topClients.length,
			icon: Users,
			color: "text-orange-600",
			bgColor: "bg-orange-50 dark:bg-orange-950/30",
			subtitle: `De ${clients.length} total`,
		},
		{
			label: "Itens por Pedido",
			value: averageItemsPerOrder.toFixed(1),
			icon: UtensilsCrossed,
			color: "text-teal-600",
			bgColor: "bg-teal-50 dark:bg-teal-950/30",
			subtitle: "Média",
		},
		{
			label: "Pratos no Cardápio",
			value: dishes.length,
			icon: UtensilsCrossed,
			color: "text-indigo-600",
			bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
		},
		{
			label: "Produtos em Estoque Baixo",
			value: inventoryMetrics.lowStock,
			icon: Package,
			color: inventoryMetrics.lowStock > 0 ? "text-red-600" : "text-green-600",
			bgColor:
				inventoryMetrics.lowStock > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-green-50 dark:bg-green-950/30",
			subtitle: `De ${inventoryMetrics.totalProducts} produtos`,
		},
	];

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<BarChart3 className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Relatórios</h1>
							<p className="text-slate-300 mt-1">Indicadores de desempenho e análises</p>
						</div>
					</div>

					{/* Month Navigation */}
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							onClick={goToPreviousMonth}
							className="h-9 w-9 bg-slate-700/50 hover:bg-slate-600/50 text-white">
							<ChevronLeft className="w-5 h-5" />
						</Button>

						<div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-2 min-w-[200px] justify-center">
							<Calendar className="w-4 h-4 text-slate-300" />
							<span className="text-white font-semibold">{selectedMonthName}</span>
						</div>

						<Button
							variant="ghost"
							size="icon"
							onClick={goToNextMonth}
							disabled={isCurrentMonth}
							className="h-9 w-9 bg-slate-700/50 hover:bg-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed">
							<ChevronRight className="w-5 h-5" />
						</Button>

						{!isCurrentMonth && (
							<Button
								variant="outline"
								size="sm"
								onClick={goToCurrentMonth}
								className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50">
								Mês Atual
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* KPI Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{kpiCards.map((kpi, idx) => (
					<Card key={idx} className={`overflow-hidden ${kpi.bgColor}`}>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
									<p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
									{kpi.subtitle && (
										<p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
									)}
								</div>
								<div className={`p-2 rounded-lg ${kpi.bgColor}`}>
									<kpi.icon className={`w-6 h-6 ${kpi.color}`} />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Most Popular Dishes */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UtensilsCrossed className="w-5 h-5 text-primary" />
							Pratos Mais Populares
						</CardTitle>
					</CardHeader>
					<CardContent>
						{dishPopularity.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Prato</TableHead>
										<TableHead className="text-center">Quantidade</TableHead>
										<TableHead className="text-right">Receita</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{dishPopularity.slice(0, 5).map((item, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{item.dish?.name}</TableCell>
											<TableCell className="text-center">
												<Badge variant="secondary">{item.count}</Badge>
											</TableCell>
											<TableCell className="text-right font-semibold text-green-600">
												${item.revenue.toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<UtensilsCrossed className="w-12 h-12 text-muted-foreground/50 mb-3" />
								<p className="text-muted-foreground">Nenhum prato vendido no período</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Top Clients */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5 text-primary" />
							Top 5 Clientes
						</CardTitle>
					</CardHeader>
					<CardContent>
						{topClients.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Cliente</TableHead>
										<TableHead className="text-center">Pedidos</TableHead>
										<TableHead className="text-right">Receita</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topClients.map((item, idx) => (
										<TableRow key={idx}>
											<TableCell className="font-medium">{item.client?.name}</TableCell>
											<TableCell className="text-center">
												<Badge variant="secondary">{item.orders}</Badge>
											</TableCell>
											<TableCell className="text-right font-semibold text-green-600">
												${item.revenue.toFixed(2)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
								<p className="text-muted-foreground">Nenhum cliente com pedidos no período</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Revenue by Dish - Full Width */}
			{dishPopularity.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DollarSign className="w-5 h-5 text-primary" />
							Receita por Prato
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12">#</TableHead>
									<TableHead>Prato</TableHead>
									<TableHead className="text-center">Quantidade Vendida</TableHead>
									<TableHead className="text-right">Receita Total</TableHead>
									<TableHead className="text-right">Receita Média</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{dishPopularity.map((item, idx) => (
									<TableRow key={idx}>
										<TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
										<TableCell className="font-medium">{item.dish?.name}</TableCell>
										<TableCell className="text-center">
											<Badge variant="outline">{item.count} unidades</Badge>
										</TableCell>
										<TableCell className="text-right font-bold text-green-600">
											${item.revenue.toFixed(2)}
										</TableCell>
										<TableCell className="text-right text-muted-foreground">
											${(item.revenue / item.count).toFixed(2)}
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

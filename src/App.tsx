import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import InventoryPage from "@/pages/InventoryPage";
import DishesPage from "@/pages/DishesPage";
import OrdersPage from "@/pages/OrdersPage";
import ClientsPage from "@/pages/ClientsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<HashRouter>
				<Routes>
					<Route element={<AppLayout />}>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/inventory" element={<InventoryPage />} />
						<Route path="/dishes" element={<DishesPage />} />
						<Route path="/orders" element={<OrdersPage />} />
						<Route path="/clients" element={<ClientsPage />} />{" "}
						<Route path="/reports" element={<ReportsPage />} />{" "}
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</HashRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;

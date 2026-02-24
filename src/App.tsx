import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ItemsPage from "@/pages/ItemsPage";
import StockPage from "@/pages/StockPage";
import InventoryPage from "@/pages/InventoryPage";
import DishesPage from "@/pages/DishesPage";
import OrdersPage from "@/pages/OrdersPage";
import ClientsPage from "@/pages/ClientsPage";
import ReportsPage from "@/pages/ReportsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<HashRouter>
				<Routes>
					<Route path="/auth/login" element={<LoginPage />} />
					<Route element={<ProtectedRoute />}>
						<Route element={<AppLayout />}>
							<Route path="/" element={<DashboardPage />} />
							<Route path="/items" element={<ItemsPage />} />
							<Route path="/stock" element={<StockPage />} />
							<Route path="/inventory" element={<InventoryPage />} />
							<Route path="/dishes" element={<DishesPage />} />
							<Route path="/orders" element={<OrdersPage />} />
							<Route path="/clients" element={<ClientsPage />} />
							<Route path="/reports" element={<ReportsPage />} />
							<Route path="/profile" element={<ProfilePage />} />
						</Route>
					</Route>
					<Route path="*" element={<NotFound />} />
				</Routes>
			</HashRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;

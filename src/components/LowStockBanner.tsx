import { useNavigate } from "react-router-dom";
import { useRestaurantStore } from "@/store/restaurantStore";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function LowStockBanner() {
	const navigate = useNavigate();
	const { products, dishes, orders } = useRestaurantStore();
	const [dismissed, setDismissed] = useState(false);

	// Calculate current quantity after deducting orders
	const calculateCurrentQuantity = (productId: string) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return 0;

		let usedQuantity = 0;
		const activeOrders = orders.filter((o) => o.status === "confirmed" || o.status === "pending");

		for (const order of activeOrders) {
			for (const item of order.items) {
				const dish = dishes.find((d) => d.id === item.dishId);
				if (dish) {
					const ingredient = dish.ingredients.find((ing) => ing.productId === productId);
					if (ingredient) {
						const ingredientQty =
							item.size === "small"
								? ingredient.quantitySmall
								: item.size === "medium"
									? ingredient.quantityMedium
									: ingredient.quantityLarge;
						usedQuantity += ingredientQty * item.quantity;
					}
				}
			}
		}

		return product.quantity - usedQuantity;
	};

	const lowStock = products.filter((p) => calculateCurrentQuantity(p.id) <= p.minStock);

	if (lowStock.length === 0 || dismissed) return null;

	return (
		<div className="bg-destructive text-white px-6 py-3 mb-6 rounded-lg shadow-lg">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3 flex-1">
					<AlertTriangle className="w-5 h-5 flex-shrink-0" />
					<div className="flex-1">
						<p className="font-semibold">
							Alerta de Estoque Baixo: {lowStock.length} {lowStock.length === 1 ? "produto" : "produtos"}
						</p>
						<p className="text-sm text-white/90">
							{lowStock.slice(0, 3).map((p, i) => (
								<span key={p.id}>
									{i > 0 && " | "}
									<strong>{p.name}</strong>: {calculateCurrentQuantity(p.id).toFixed(2)} {p.unit}
								</span>
							))}
							{lowStock.length > 3 && ` e mais ${lowStock.length - 3}...`}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => navigate("/inventory")}
						className="px-4 py-2 bg-white text-destructive rounded-md text-sm font-medium hover:bg-white/90 transition-colors">
						Ver Estoque
					</button>
				</div>
			</div>
		</div>
	);
}

import { forwardRef } from "react";
import type { Order, OrderProduct } from "@/types/api";

interface OrderLabelsTemplateProps {
	order: Order;
	customerName: string;
}

/**
 * Printable template component for order meal labels
 * Each label shows customer name, order ID, and dish name
 * Designed to be printed and cut manually for attaching to meals
 */
export const OrderLabelsTemplate = forwardRef<HTMLDivElement, OrderLabelsTemplateProps>(
	({ order, customerName }, ref) => {
		// Group products by name to get quantities
		const productMap = new Map<string, { name: string; quantity: number }>();
		
		if (order.products) {
			order.products.forEach((product: OrderProduct) => {
				const existing = productMap.get(product.id);
				if (existing) {
					existing.quantity += Number(product.quantity);
				} else {
					productMap.set(product.id, {
						name: product.name,
						quantity: Number(product.quantity),
					});
				}
			});
		}

		// Create an array of labels (one for each meal)
		const labels: { productName: string; index: number }[] = [];
		productMap.forEach((product) => {
			for (let i = 0; i < product.quantity; i++) {
				labels.push({
					productName: product.name,
					index: i + 1,
				});
			}
		});

		return (
			<div ref={ref} className="print-container">
				{/* Print styles */}
				<style>
					{`
						@media print {
							@page {
								size: A4;
								margin: 10mm;
							}
							
							body {
								-webkit-print-color-adjust: exact;
								print-color-adjust: exact;
							}
							
							.print-container {
								width: 100%;
							}
							
							.label-grid {
								display: grid;
								grid-template-columns: repeat(3, 1fr);
								gap: 5mm;
								page-break-inside: avoid;
							}
							
							.meal-label {
								border: 2px dashed #333;
								padding: 6mm;
								background: white;
								page-break-inside: avoid;
								height: 60mm;
								display: flex;
								flex-direction: column;
								justify-content: center;
								align-items: center;
								text-align: center;
							}
							
							.label-header {
								font-size: 10pt;
								font-weight: bold;
								margin-bottom: 3mm;
								text-transform: uppercase;
								color: #1e293b;
								border-bottom: 2px solid #e2e8f0;
								padding-bottom: 2mm;
								width: 100%;
							}
							
							.customer-name {
								font-size: 13pt;
								font-weight: bold;
								margin: 3mm 0;
								color: #0f172a;
							}
							
							.product-name {
								font-size: 12pt;
								font-weight: 600;
								margin: 3mm 0;
								color: #334155;
							}
							
							.order-info {
								font-size: 8pt;
								color: #64748b;
								margin-top: 3mm;
								padding-top: 3mm;
								border-top: 1px solid #e2e8f0;
								width: 100%;
							}
							
							.label-logo {
								width: 30mm;
								height: auto;
								margin-bottom: 2mm;
							}
						}
						
						/* Screen preview styles */
						@media screen {
							.print-container {
								background: #f1f5f9;
								padding: 20px;
								min-height: 100vh;
							}
							
							.label-grid {
								display: grid;
								grid-template-columns: repeat(3, 1fr);
								max-width: 210mm;
								margin: 0 auto;
							}
							
							.meal-label {
								border: 2px dashed #333;
								padding: 16px;
								background: white;
								min-height: 60mm;
								display: flex;
								flex-direction: column;
								justify-content: center;
								align-items: center;
								text-align: center;
								box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
							}
							
							.label-header {
								font-size: 10pt;
								font-weight: bold;
								margin-bottom: 8px;
								text-transform: uppercase;
								color: #1e293b;
								border-bottom: 2px solid #e2e8f0;
								padding-bottom: 6px;
								width: 100%;
							}
							
							.customer-name {
								font-size: 13pt;
								font-weight: bold;
								margin: 8px 0;
								color: #0f172a;
							}
							
							.product-name {
								font-size: 12pt;
								font-weight: 600;
								margin: 8px 0;
								color: #334155;
							}
							
							.order-info {
								font-size: 8pt;
								color: #64748b;
								margin-top: 12px;
								padding-top: 8px;
								border-top: 1px solid #e2e8f0;
								width: 100%;
							}
							
							.label-logo {
								width: 80px;
								height: auto;
								margin-bottom: 8px;
							}
						}
					`}
				</style>

				{/* Title for screen preview (hidden in print) */}
				<div style={{ textAlign: "center", marginBottom: "20px" }} className="no-print">
					<h1 style={{ fontSize: "24pt", fontWeight: "bold", color: "#1e293b" }}>
						Etiquetas do Pedido
					</h1>
					<p style={{ fontSize: "12pt", color: "#64748b", marginTop: "8px" }}>
						Pedido #{order.id.substring(0, 8).toUpperCase()} - {customerName}
					</p>
					<p style={{ fontSize: "10pt", color: "#94a3b8", marginTop: "4px" }}>
						Total de {labels.length} etiqueta(s) para impressão
					</p>
				</div>

				{/* Labels grid */}
				<div className="label-grid">
					{labels.map((label, idx) => (
						<div key={idx} className="meal-label">
						<img src="/logo.png" alt="Logo" className="label-logo" />
							
							<div className="customer-name">{customerName}</div>
							
							<div className="product-name">{label.productName}</div>
							
							<div className="order-info">
								<div>
									{new Date(order.created_at).toLocaleDateString("EN-us", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									})}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}
);

OrderLabelsTemplate.displayName = "OrderLabelsTemplate";

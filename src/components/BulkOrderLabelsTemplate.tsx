import { forwardRef } from "react";
import type { Order, OrderProduct } from "@/types/api";

interface BulkOrderLabelsTemplateProps {
	orders: Order[];
}

interface LabelEntry {
	productName: string;
	netWeightG: number;
	validadeStr: string;
	orderId: string;
}

function calcNetWeight(product: OrderProduct): number {
	return (product.items ?? []).reduce((sum, item) => {
		const qty = Number(item.quantity);
		if (item.unit_type === "grams") return sum + qty;
		if (item.unit_type === "kg") return sum + qty * 1000;
		return sum;
	}, 0);
}

function bestBeforeDate(isoDate: string): string {
	const d = new Date(isoDate);
	d.setMonth(d.getMonth() + 3);
	return d.toLocaleDateString("en-US", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * Bulk printable label template.
 * Merges labels from multiple orders into one continuous 3-column grid so
 * pages are filled efficiently and no paper is wasted on sparse orders.
 */
export const BulkOrderLabelsTemplate = forwardRef<
	HTMLDivElement,
	BulkOrderLabelsTemplateProps
>(({ orders }, ref) => {
	const allLabels: LabelEntry[] = [];

	orders.forEach((order) => {
		if (!order.products) return;
		const validadeStr = bestBeforeDate(order.created_at);
		order.products.forEach((product: OrderProduct) => {
			const qty = Number(product.quantity) || 1;
			const netWeightG = calcNetWeight(product);
			for (let i = 0; i < qty; i++) {
				allLabels.push({
					productName: product.name,
					netWeightG,
					validadeStr,
					orderId: order.id,
				});
			}
		});
	});

	return (
		<div ref={ref} className="bulk-print-container">
			<style>{`
				.bulk-print-container { font-family: Arial, sans-serif; }
			.bulk-label-grid {
				width: max-content;
				margin: 0 auto;
				display: grid;
				grid-template-columns: repeat(4, 70mm);
			}
			.bulk-meal-label {
				border: 2px dashed #555;
				background: #fff;
				display: flex;
				flex-direction: column;
				align-items: center;
				text-align: center;
				width: 70mm;
			}
			.bulk-label-logo { height: auto; display: block; margin: 0 auto; }
			.bulk-product-wrapper {
				background: transparent;
				color: #1e293b;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.04em;
				width: 100%;
				border: 2px solid #1e293b;
				box-sizing: border-box;
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 15mm;
			}
			.bulk-meta-row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				width: 100%;
				border-top: 1px solid #e2e8f0;
			}
			.bulk-meta-chip {
				display: flex;
				align-items: center;
				gap: 3px;
				font-weight: 600;
				color: #334155;
			}
			.bulk-meta-chip svg { flex-shrink: 0; }
			.bulk-info-row {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 4px;
				width: 100%;
				border-top: 1px solid #e2e8f0;
				color: #334155;
				font-weight: 600;
			}
			.bulk-info-row-microwave {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
				width: 100%;
				border-top: 1px solid #e2e8f0;
				color: #1e293b;
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.03em;
			}
			.bulk-label-footer {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 4px;
			}
			@media print {
				@page { size: A4; margin: 10mm; }
				body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
				.bulk-print-container { width: 100%; }
				.bulk-meal-label { padding: 4mm; height: 70mm; page-break-inside: avoid; }
				.bulk-label-logo { width: 20mm; margin-bottom: 2mm; }
				.bulk-product-wrapper { font-size: 11pt; padding: 2mm 3mm; border-radius: 2mm; margin-bottom: 2mm; }
				.bulk-meta-row { padding: 1.5mm 0; }
				.bulk-meta-chip { font-size: 7.5pt; }
				.bulk-info-row { font-size: 7.5pt; padding: 1.5mm 0; }
				.bulk-info-row-microwave { font-size: 10pt; padding: 2mm 0; }
				.bulk-label-footer { font-size: 8pt; padding: 1.5mm 0; margin-top: auto; }
				.bulk-no-print { display: none !important; }
			}
			@media screen {
				.bulk-print-container { background: #f1f5f9; padding: 20px; min-height: 100vh; }
				.bulk-meal-label { padding: 30mm; min-height: 70mm; box-shadow: 0 2px 8px rgba(0,0,0,.12); border-radius: 6px; }
					.bulk-meta-row { padding: 6px 0; }
					.bulk-meta-chip { font-size: 8pt; }
					.bulk-info-row { font-size: 8pt; padding: 6px 0; }
					.bulk-info-row-microwave { font-size: 11pt; padding: 8px 0; font-weight: 800; }
					.bulk-label-footer { font-size: 8.5pt; padding: 6px 0; margin-top: auto; }
				}
			`}</style>

			{/* Screen-only heading */}
			<div style={{ textAlign: "center", marginBottom: 20 }} className="bulk-no-print">
				<h1 style={{ fontSize: 22, fontWeight: "bold", color: "#1e293b" }}>
					Bulk Print — {orders.length} order(s)
				</h1>
				<p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
					{allLabels.length} label(s) total across all selected orders
				</p>
			</div>

			<div className="bulk-label-grid">
				{allLabels.map((label, idx) => (
					<div key={idx} className="bulk-meal-label">
						<img src="/logo.png" alt="Logo" className="bulk-label-logo" />

						<div className="bulk-product-wrapper">{label.productName}</div>

						<div className="bulk-meta-row">
							<div className="bulk-meta-chip">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M12 3C8 3 4 6 4 10h16c0-4-4-7-8-7z"/>
									<line x1="4" y1="10" x2="20" y2="10"/>
									<line x1="12" y1="10" x2="12" y2="20"/>
									<rect x="8" y="20" width="8" height="2" rx="1"/>
								</svg>
								{label.netWeightG > 0 ? `Net weight: ${label.netWeightG}g` : "Net weight: —"}
							</div>
							<div className="bulk-meta-chip" style={{ color: "#0369a1" }}>
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="12" y1="2" x2="12" y2="22"/>
									<line x1="2" y1="12" x2="22" y2="12"/>
									<line x1="5" y1="5" x2="19" y2="19"/>
									<line x1="19" y1="5" x2="5" y2="19"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
								Keep frozen
							</div>
						</div>

						<div className="bulk-info-row-microwave">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="2" y="5" width="20" height="15" rx="2"/>
								<polygon points="7,9 7,15 13,12"/>
								<line x1="17" y1="9" x2="17" y2="9.01"/>
								<line x1="17" y1="12" x2="17" y2="12.01"/>
								<line x1="17" y1="15" x2="17" y2="15.01"/>
							</svg>
							Microwave: 5–7 min
						</div>

						<div className="bulk-info-row">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="3" y="4" width="18" height="18" rx="2"/>
								<line x1="16" y1="2" x2="16" y2="6"/>
								<line x1="8" y1="2" x2="8" y2="6"/>
								<line x1="3" y1="10" x2="21" y2="10"/>
							</svg>
							Best before: {label.validadeStr}
						</div>

						<div className="bulk-label-footer">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<rect x="2" y="2" width="20" height="20" rx="5"/>
								<circle cx="12" cy="12" r="4"/>
								<circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
							</svg>
							@beju.food
						</div>
					</div>
				))}
			</div>
		</div>
	);
});

BulkOrderLabelsTemplate.displayName = "BulkOrderLabelsTemplate";

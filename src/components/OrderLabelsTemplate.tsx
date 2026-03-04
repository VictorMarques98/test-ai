import { forwardRef } from "react";
import type { Order, OrderProduct } from "@/types/api";

interface OrderLabelsTemplateProps {
	order: Order;
	customerName: string;
}

/** Compute net weight in grams from product items (grams + kg units only). */
function calcNetWeight(product: OrderProduct): number {
	return (product.items ?? []).reduce((sum, item) => {
		const qty = Number(item.quantity);
		if (item.unit_type === "grams") return sum + qty;
		if (item.unit_type === "kg") return sum + qty * 1000;
		return sum;
	}, 0);
}

/** Return a date string 3 months after the given ISO date string. */
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
 * Printable template component for order meal labels.
 * Each label shows: logo, meal name (wrapped), net weight, keep-frozen,
 * microwave time, best-before date, and @beju.food instagram handle.
 */
export const OrderLabelsTemplate = forwardRef<HTMLDivElement, OrderLabelsTemplateProps>(
	({ order }, ref) => {
		// Build label entries — one per unit, carrying net weight
		const labels: { productName: string; netWeightG: number }[] = [];

		if (order.products) {
			order.products.forEach((product: OrderProduct) => {
				const qty = Number(product.quantity) || 1;
				const netWeightG = calcNetWeight(product);
				for (let i = 0; i < qty; i++) {
					labels.push({ productName: product.name, netWeightG });
				}
			});
		}

		const validadeStr = bestBeforeDate(order.created_at);

		return (
			<div ref={ref} className="print-container">
				<style>{`
					/* ── shared ── */
					.print-container { font-family: Arial, sans-serif; }

					.label-grid {
						width: max-content;
						margin: 0 auto;
						display: grid;
						grid-template-columns: repeat(4, 70mm);
					}

					.meal-label {
						border: 2px dashed #555;
						background: #fff;
						display: flex;
						flex-direction: column;
						align-items: center;
						text-align: center;
						max-width: 70mm;					}

					.label-logo { height: auto; display: block; margin: 0 auto; }

					.product-wrapper {
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
						min-height: 60px;
					}

					.meta-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
						width: 100%;
						border-top: 1px solid #e2e8f0;
					}

					.meta-chip {
						display: flex;
						align-items: center;
						gap: 3px;
						font-weight: 600;
						color: #334155;
					}

					.meta-chip svg { flex-shrink: 0; }

					.info-row {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 4px;
						width: 100%;
						border-top: 1px solid #e2e8f0;
						color: #334155;
						font-weight: 600;
					}

					.info-row-microwave {
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

					.label-footer {
						display: flex;
						align-items: center;
						justify-content: center;
						gap: 4px;
					}

					/* ── print ── */
					@media print {
						@page { size: A4; margin: 10mm; }
						body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
						.print-container { width: 100%; }
						.meal-label { padding: 4mm; height: 70mm; page-break-inside: avoid; }
						.label-logo { width: 28mm; margin-bottom: 2mm; }
						.product-wrapper { font-size: 11pt; padding: 2mm 3mm; border-radius: 2mm; margin-bottom: 2mm; }
						.meta-row { padding: 1.5mm 0; }
						.meta-chip { font-size: 7.5pt; }
						.info-row { font-size: 7.5pt; padding: 1.5mm 0; }
						.info-row-microwave { font-size: 10pt; padding: 2mm 0; }
						.label-footer { font-size: 8pt; padding: 1.5mm 0; margin-top: auto; }
						.no-print { display: none !important; }
					}

					/* ── screen ── */
					@media screen {
						.print-container { background: #f1f5f9; padding: 20px; min-height: 100vh; }
						.meal-label { padding: 14px; min-height: 70mm; box-shadow: 0 2px 8px rgba(0,0,0,.12); border-radius: 6px; }
						.label-logo { width: 80px; margin-bottom: 8px; }
					.product-wrapper { font-size: 11pt; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; }
					.meta-row { padding: 6px 0; }
					.meta-chip { font-size: 8pt; }
					.info-row { font-size: 8pt; padding: 6px 0; }
						.info-row-microwave { font-size: 11pt; padding: 8px 0; font-weight: 800; }
						.label-footer { font-size: 8.5pt; padding: 6px 0; margin-top: auto; }
					}
				`}</style>

				<div className="label-grid">
					{labels.map((label, idx) => (
						<div key={idx} className="meal-label">
							{/* Logo */}
							<img src="/logo.png" alt="Logo" className="label-logo" />

							{/* Meal name wrapper */}
							<div className="product-wrapper">{label.productName}</div>

							{/* Net weight + Keep frozen */}
							<div className="meta-row">
								{/* Net weight */}
								<div className="meta-chip">
									{/* scale icon */}
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M12 3C8 3 4 6 4 10h16c0-4-4-7-8-7z"/>
										<line x1="4" y1="10" x2="20" y2="10"/>
										<line x1="12" y1="10" x2="12" y2="20"/>
										<rect x="8" y="20" width="8" height="2" rx="1"/>
									</svg>
									{label.netWeightG > 0
									? `Net weight: ${label.netWeightG}g`
									: "Net weight: —"}
								</div>

								{/* Keep frozen */}
								<div className="meta-chip" style={{ color: "#0369a1" }}>
									{/* snowflake icon */}
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

							{/* Microwave — prominent row */}
							<div className="info-row-microwave">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect x="2" y="5" width="20" height="15" rx="2"/>
									<polygon points="7,9 7,15 13,12"/>
									<line x1="17" y1="9" x2="17" y2="9.01"/>
									<line x1="17" y1="12" x2="17" y2="12.01"/>
									<line x1="17" y1="15" x2="17" y2="15.01"/>
								</svg>
								Microwave: 5–7 min
							</div>

							{/* Best before */}
							<div className="info-row">
								{/* calendar icon */}
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect x="3" y="4" width="18" height="18" rx="2"/>
									<line x1="16" y1="2" x2="16" y2="6"/>
									<line x1="8" y1="2" x2="8" y2="6"/>
									<line x1="3" y1="10" x2="21" y2="10"/>
								</svg>
								Best before: {validadeStr}
							</div>

							{/* Instagram footer */}
							<div className="label-footer">
								{/* instagram icon */}
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
	}
);

OrderLabelsTemplate.displayName = "OrderLabelsTemplate";

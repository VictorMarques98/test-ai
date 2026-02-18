import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { AlertTriangle, Package, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

export default function InventoryPage() {
	const location = useLocation();
	const { 
		items, 
		isLoading, 
		error, 
		fetchItems, 
		createItem, 
		updateItem, 
		deleteItem,
		clearError 
	} = useRestaurantStore();
	const [open, setOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState({ 
		name: "", 
		description: "", 
		unit_type: "" as "grams" | "unit" | ""
	});

	// Fetch items on mount
	useEffect(() => {
		fetchItems().catch(err => {
			console.error('Failed to load items:', err);
		});
	}, [fetchItems]);

	// Handle opening modal from navigation
	useEffect(() => {
		const state = location.state as { openModal?: boolean } | null;
		if (state?.openModal) {
			setOpen(true);
			window.history.replaceState({}, document.title);
		}
	}, [location.state]);

	// Auto-clear errors after 5 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				clearError();
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const resetForm = () => {
		setForm({ name: "", description: "", unit_type: "" as "" });
		setEditId(null);
	};

	const handleSubmit = async () => {
		if (!form.name.trim() || !form.unit_type) {
			toast.error('Por favor, preencha os campos obrigatórios');
			return;
		}

		try {
			const data = {
				name: form.name.trim(),
				unit_type: form.unit_type,
				description: form.description.trim() || null,
			};

			if (editId) {
				await updateItem(editId, data);
				toast.success('Item atualizado com sucesso!');
			} else {
				await createItem(data);
				toast.success('Item criado com sucesso!');
			}
			resetForm();
			setOpen(false);
		} catch (err: any) {
			console.error('Failed to save item:', err);
			toast.error(err.message || 'Erro ao salvar item');
		}
	};

	const startEdit = (item: typeof items[0]) => {
		setEditId(item.id);
		setForm({
			name: item.name,
			description: item.description || "",
			unit_type: item.unit_type,
		});
		setOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Tem certeza que deseja excluir este item?')) return;

		try {
			await deleteItem(id);
			toast.success('Item excluído com sucesso!');
		} catch (err: any) {
			console.error('Failed to delete item:', err);
			toast.error(err.message || 'Erro ao excluir item');
		}
	};

	return (
		<div className="space-y-6">
			{/* Error Alert */}
			{error && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Header Section */}
			<div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/20 rounded-lg">
							<Package className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Controle de estoque</h1>
							<p className="text-slate-300 mt-1">Gerencie seus ingredientes</p>
						</div>
					</div>
					<Dialog
						open={open}
						onOpenChange={(v) => {
							setOpen(v);
							if (!v) resetForm();
						}}>
						<DialogTrigger asChild>
							<Button size="lg" className="shadow-lg" disabled={isLoading}>
								<Plus className="w-4 h-4 mr-2" />
								Adicionar Item
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{editId ? "Editar Item" : "Novo Item"}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 mt-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Nome do Item *</label>
									<Input
										placeholder="Ex: Tomate, Farinha, Ovos..."
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Descrição (opcional)</label>
									<Input
										placeholder="Descrição do item"
										value={form.description}
										onChange={(e) => setForm({ ...form, description: e.target.value })}
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-sm font-medium">Tipo de Unidade *</label>
									<Select 
										value={form.unit_type} 
										onValueChange={(v: "grams" | "unit") => setForm({ ...form, unit_type: v })}
										disabled={isLoading}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecione o tipo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="grams">Gramas (g/kg)</SelectItem>
											<SelectItem value="unit">Unidade (un)</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
									<p className="font-medium mb-1">💡 Dica:</p>
									<p><strong>Gramas:</strong> Use para ingredientes medidos por peso (farinha, açúcar, carne)</p>
									<p><strong>Unidade:</strong> Use para itens contáveis (ovos, latas, garrafas)</p>
								</div>
								<Button 
									className="w-full" 
									onClick={handleSubmit}
									disabled={isLoading}
								>
									{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
									{editId ? "Atualizar" : "Adicionar Item"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Table Section */}
			{isLoading && items.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
						<p className="text-muted-foreground">Carregando itens...</p>
					</CardContent>
				</Card>
			) : items.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Package className="w-12 h-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">
							Nenhum item ainda. Adicione seu primeiro item para começar.
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="font-bold">Item</TableHead>
									<TableHead className="font-bold">Descrição</TableHead>
									<TableHead className="font-bold">Tipo de Unidade</TableHead>
									<TableHead className="font-bold">Data de Criação</TableHead>
									<TableHead className="text-right font-bold">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => {
									return (
										<TableRow key={item.id} className="hover:bg-muted/30">
											<TableCell className="font-semibold">
												{item.name}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{item.description || (
													<span className="text-muted-foreground/50 italic">Sem descrição</span>
												)}
											</TableCell>
											<TableCell>
												<span className={
													item.unit_type === 'grams' 
														? "px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500 font-semibold text-sm"
														: "px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-500 font-semibold text-sm"
												}>
													{item.unit_type === 'grams' ? '📏 Gramas' : '🔢 Unidade'}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—'}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-primary/10 hover:text-primary"
														onClick={() => startEdit(item)}
														disabled={isLoading}>
														<Pencil className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="hover:bg-destructive/10 hover:text-destructive"
														onClick={() => handleDelete(item.id)}
														disabled={isLoading}>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

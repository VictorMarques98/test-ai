import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useRestaurantStore } from "@/store/restaurantStoreApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  Pencil,
  UtensilsCrossed,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductItemDto } from "@/types/api";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";

type DishFormValues = {
  name: string;
  description: string;
  price: string;
  buyPrice: string;
  isAdditional: boolean;
  items: ProductItemDto[];
};

const DEFAULT_VALUES: DishFormValues = {
  name: "",
  description: "",
  price: "",
  buyPrice: "",
  isAdditional: false,
  items: [],
};

export default function DishesPage() {
  const location = useLocation();
  const {
    products,
    items,
    isLoading,
    error,
    fetchProducts,
    fetchItems,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  } = useRestaurantStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const form = useForm<DishFormValues>({
    defaultValues: DEFAULT_VALUES,
  });
  const { formState, watch, setValue, getValues, reset } = form;
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const isDirty = formState.isDirty;

  // Fetch data on mount
  useEffect(() => {
    Promise.all([fetchProducts(), fetchItems()]).catch((err) => {
      console.error("Failed to load data:", err);
    });
  }, [fetchProducts, fetchItems]);

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
    reset(DEFAULT_VALUES);
    setEditId(null);
  };

  const handleSubmit = async () => {
    const { name: n, description: d, price: p, buyPrice: bp, isAdditional: isAdd, items: productItems } = getValues();
    if (!n.trim() || productItems.length === 0) {
      showErrorToast(
        "Por favor, preencha o nome e adicione pelo menos um ingrediente",
      );
      return;
    }

    const parseIntegerField = (s: string): number | undefined => {
      if (!s.trim()) return undefined;
      const num = parseInt(s.trim(), 10);
      return Number.isFinite(num) ? num : undefined;
    };

    try {
      const data = {
        name: n.trim(),
        description: d.trim() || undefined,
        price: parseIntegerField(p),
        buyPrice: parseIntegerField(bp),
        is_additional: isAdd, // API field
        items: productItems,
      };

      if (editId) {
        await updateProduct(editId, data);
        showSuccessToast("Prato atualizado com sucesso!");
      } else {
        await createProduct(data);
        showSuccessToast("Prato criado com sucesso!");
      }
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      showErrorToast((err as Error)?.message || "Falha ao salvar prato");
    }
  };

  const startEdit = (product: (typeof products)[0]) => {
    setEditId(product.id);
    const priceStr = product.price ? String(Math.round(Number(product.price))) : "";
    const buyPriceStr = product.buyPrice ? String(Math.round(Number(product.buyPrice))) : "";
    const mappedItems: ProductItemDto[] = (product.product_items || []).map(
      (pi) => ({
        itemId: pi.item_id,
        quantity: Number(pi.quantity),
      }),
    );
    reset({
      name: product.name,
      description: product.description || "",
      price: priceStr,
      buyPrice: buyPriceStr,
      isAdditional: product.is_additional || false,
      items: mappedItems,
    });
    setOpen(true);
  };

  const addIngredient = () => {
    if (items.length === 0) return;
    append({ itemId: items[0].id, quantity: 1 });
  };

  /** Permite apenas dígitos (inteiros) no campo de quantidade, máx. 6 caracteres */
  const handleQuantityInput = (idx: number, raw: string) => {
    if (raw.length > 6) return;
    if (/^\d*$/.test(raw)) {
      const qty = raw === "" ? 0 : Number(raw);
      update(idx, { ...fields[idx], quantity: qty });
    }
  };

  /** Permite apenas dígitos (inteiros), máx. 6 caracteres - para preço e custo */
  const handleIntegerFieldInput = (field: "price" | "buyPrice", raw: string) => {
    if (raw.length > 6) return;
    if (/^\d*$/.test(raw)) setValue(field, raw, { shouldDirty: true });
  };

  const getItemName = (id: string) =>
    items.find((i) => i.id === id)?.name || "Desconhecido";
  const getItemUnit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return "";

    const unitMap = {
      grams: "g",
      kg: "kg",
      ml: "ml",
      liters: "L",
      unit: "un",
    };

    return unitMap[item.unit_type] || "";
  };

  const handleCloseDishDialog = (v: boolean) => {
    if (!v) {
      if (isDirty) {
        setConfirmDiscardOpen(true);
      } else {
        setOpen(false);
        resetForm();
      }
    } else {
      setOpen(v);
      if (!editId) reset(DEFAULT_VALUES);
    }
  };

  const handleConfirmDiscardDish = () => {
    setOpen(false);
    resetForm();
    setConfirmDiscardOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cardapio</h1>
              <p className="text-slate-300 mt-1">
                Visualize todos seus pratos.
              </p>
            </div>
          </div>
          <ConfirmDiscardDialog
            open={confirmDiscardOpen}
            onOpenChange={setConfirmDiscardOpen}
            onConfirm={handleConfirmDiscardDish}
          />
          <Dialog open={open} onOpenChange={handleCloseDishDialog}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="shadow-lg"
                disabled={items.length === 0 || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                {items.length === 0
                  ? "Adicione ingredientes primeiro"
                  : "Novo Prato"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Editar Prato" : "Novo Prato"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2 overflow-y-auto px-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome do Prato *</label>
                  <Input
                    placeholder="Nome do prato"
                    {...form.register("name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    placeholder="Descrição do prato (opcional)"
                    {...form.register("description")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_additional"
                    className="h-4 w-4 rounded border-gray-300"
                    {...form.register("isAdditional")}
                  />
                  <label
                    htmlFor="is_additional"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Complemento (não compõe prato principal)
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Preço unitário
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="$"
                      maxLength={6}
                      value={watch("price")}
                      onChange={(e) =>
                        handleIntegerFieldInput("price", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Custo</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="$"
                      maxLength={6}
                      value={watch("buyPrice")}
                      onChange={(e) =>
                        handleIntegerFieldInput("buyPrice", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Ingredientes *</p>
                    <Button variant="outline" size="sm" onClick={addIngredient}>
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/30"
                      >
                        <Select
                          value={field.itemId}
                          onValueChange={(v) =>
                            update(idx, { ...field, itemId: v })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((i) => (
                              <SelectItem key={i.id} value={i.id}>
                                {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="text-sm w-20"
                            placeholder="0"
                            value={
                              field.quantity === 0 ? "" : String(field.quantity)
                            }
                            onChange={(e) =>
                              handleQuantityInput(idx, e.target.value)
                            }
                          />
                          <span className="text-xs text-muted-foreground min-w-[30px]">
                            {getItemUnit(field.itemId)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => remove(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={
                    !watch("name")?.trim() ||
                    fields.length === 0 ||
                    isLoading ||
                    (!!editId && !isDirty)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editId ? "Atualizando..." : "Criando..."}
                    </>
                  ) : editId ? (
                    "Atualizar Prato"
                  ) : (
                    "Criar Prato"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Carregando pratos...</p>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum prato ainda. Crie seu primeiro prato.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-b flex-shrink-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 text-sm">
                        {product.price && (
                          <span className="text-muted-foreground">
                            Preço Venda:{" "}
                            <span className="font-bold text-primary">
                              ${Number(product.price).toFixed(2)}
                            </span>
                          </span>
                        )}
                        {product.buyPrice && (
                          <span className="text-muted-foreground">
                            Preço Custo:{" "}
                            <span className="font-semibold text-foreground">
                              ${Number(product.buyPrice).toFixed(2)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-2">
                      {product.is_additional && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        >
                          Complemento
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (
                              confirm(
                                "Tem certeza que deseja excluir este prato?",
                              )
                            ) {
                              try {
                                await deleteProduct(product.id);
                                showSuccessToast("Prato excluído com sucesso!");
                              } catch (error: any) {
                                showErrorToast(
                                  error.message || "Falha ao excluir prato",
                                );
                              }
                            }
                          }}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>{" "}
                      </div>{" "}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">
                    Ingredientes
                  </p>
                  <div className="space-y-2">
                    {(product.product_items || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhum ingrediente
                      </p>
                    ) : (
                      (product.product_items || []).map((pi, i) => (
                        <div
                          key={i}
                          className="text-xs bg-secondary/50 p-2 rounded"
                        >
                          <div className="font-semibold">
                            {pi.item?.name || getItemName(pi.item_id)}
                          </div>
                          <div className="text-muted-foreground">
                            {Math.round(Number(pi.quantity))}{" "}
                            {getItemUnit(pi.item_id)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

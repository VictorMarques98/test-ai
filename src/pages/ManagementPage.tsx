import { useState, useMemo, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserCheck,
  Eye,
  EyeOff,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useAuthStore } from "@/store/authStore";
import { tenantsService } from "@/services/tenantsService";
import { usersService } from "@/services/usersService";
import type {
  Tenant,
  User,
  CreateTenantDto,
  UpdateTenantDto,
  RegisterDto,
  UpdateUserDto,
} from "@/types/api";

type TenantFormValues = {
  name: string;
  type: "kds" | "";
};

const TENANT_DEFAULT: TenantFormValues = { name: "", type: "kds" };

type UserFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: string;
};

const USER_CREATE_DEFAULT: UserFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  role: "manager",
};

function getEditUserDefault(u: User | null): UserFormValues {
  return {
    name: u?.name ?? "",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    address: u?.address ?? "",
    password: "",
    role: u?.role ?? "manager",
  };
}

export default function ManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userAuth = useAuthStore((s) => s.userAuth);
  const isAdmin = userAuth?.role === "admin";

  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showInactiveForTenant, setShowInactiveForTenant] = useState<Set<string>>(new Set());

  const [openCreateTenant, setOpenCreateTenant] = useState(false);
  const [confirmDiscardTenant, setConfirmDiscardTenant] = useState(false);
  const [submittingTenant, setSubmittingTenant] = useState(false);

  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [createUserTenantId, setCreateUserTenantId] = useState<string | null>(null);
  const [confirmDiscardCreateUser, setConfirmDiscardCreateUser] = useState(false);
  const [submittingCreateUser, setSubmittingCreateUser] = useState(false);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserTenantId, setEditUserTenantId] = useState<string | null>(null);
  const [openEditUser, setOpenEditUser] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [confirmDiscardEditUser, setConfirmDiscardEditUser] = useState(false);
  const [submittingEditUser, setSubmittingEditUser] = useState(false);

  const tenantForm = useForm<TenantFormValues>({ defaultValues: TENANT_DEFAULT });
  const createUserForm = useForm<UserFormValues>({ defaultValues: USER_CREATE_DEFAULT });
  const editUserForm = useForm<UserFormValues>({ defaultValues: getEditUserDefault(null) });

  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsService.getTenants(),
    enabled: isAdmin,
  });

  const toggleRow = (tenantId: string) => {
    const next = new Set(expandedRows);
    if (next.has(tenantId)) next.delete(tenantId);
    else next.add(tenantId);
    setExpandedRows(next);
  };

  const refetchTenants = () => {
    queryClient.invalidateQueries({ queryKey: ["tenants"] });
  };

  const filteredTenants = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tenants;
    return tenants.filter((t) => t.name.toLowerCase().includes(q));
  }, [tenants, search]);

  const handleCloseCreateTenant = (open: boolean) => {
    if (!open) {
      if (tenantForm.formState.isDirty) setConfirmDiscardTenant(true);
      else {
        setOpenCreateTenant(false);
        tenantForm.reset(TENANT_DEFAULT);
      }
    } else {
      setOpenCreateTenant(open);
    }
  };

  const handleConfirmDiscardTenant = () => {
    setOpenCreateTenant(false);
    tenantForm.reset(TENANT_DEFAULT);
    setConfirmDiscardTenant(false);
  };

  const handleSubmitCreateTenant = async () => {
    const { name, type } = tenantForm.getValues();
    if (!name.trim()) return;
    setSubmittingTenant(true);
    try {
      const payload: CreateTenantDto = { name: name.trim(), type: type === "kds" ? "kds" : undefined };
      await tenantsService.createTenant(payload);
      showSuccessToast("Tenant criado com sucesso!");
      tenantForm.reset(TENANT_DEFAULT);
      setOpenCreateTenant(false);
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao criar tenant");
    } finally {
      setSubmittingTenant(false);
    }
  };

  const openAddUserModal = (tenantId: string) => {
    setCreateUserTenantId(tenantId);
    createUserForm.reset(USER_CREATE_DEFAULT);
    setOpenCreateUser(true);
  };

  const handleCloseCreateUser = (open: boolean) => {
    if (!open) {
      if (createUserForm.formState.isDirty) setConfirmDiscardCreateUser(true);
      else {
        setOpenCreateUser(false);
        setCreateUserTenantId(null);
        createUserForm.reset(USER_CREATE_DEFAULT);
      }
    } else {
      setOpenCreateUser(open);
    }
  };

  const handleConfirmDiscardCreateUser = () => {
    setOpenCreateUser(false);
    setCreateUserTenantId(null);
    createUserForm.reset(USER_CREATE_DEFAULT);
    setConfirmDiscardCreateUser(false);
  };

  const handleSubmitCreateUser = async () => {
    if (!createUserTenantId) return;
    const data = createUserForm.getValues();
    if (!data.name.trim() || !data.email.trim() || !data.password.trim()) return;
    setSubmittingCreateUser(true);
    try {
      const payload: RegisterDto = {
        tenantId: createUserTenantId,
        role: data.role || "manager",
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim() || undefined,
        address: data.address.trim() || undefined,
        password: data.password.trim(),
      };
      await usersService.createUser(payload);
      showSuccessToast("Usuário criado com sucesso!");
      setOpenCreateUser(false);
      setCreateUserTenantId(null);
      createUserForm.reset(USER_CREATE_DEFAULT);
      refetchTenants();
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao criar usuário");
    } finally {
      setSubmittingCreateUser(false);
    }
  };

  const startEditUser = (u: User, tenantId: string) => {
    setEditUserId(u.id);
    setEditUserTenantId(tenantId);
    editUserForm.reset(getEditUserDefault(u));
    setOpenEditUser(true);
  };

  const handleCloseEditUser = (open: boolean) => {
    if (!open) {
      if (editUserForm.formState.isDirty) setConfirmDiscardEditUser(true);
      else {
        setOpenEditUser(false);
        setEditUserId(null);
        setEditUserTenantId(null);
        editUserForm.reset(getEditUserDefault(null));
      }
    } else {
      setOpenEditUser(open);
    }
  };

  const handleConfirmDiscardEditUser = () => {
    setOpenEditUser(false);
    setEditUserId(null);
    setEditUserTenantId(null);
    editUserForm.reset(getEditUserDefault(null));
    setConfirmDiscardEditUser(false);
  };

  const handleSubmitEditUser = async () => {
    if (!editUserId) return;
    const data = editUserForm.getValues();
    const payload: UpdateUserDto = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      role: data.role || undefined,
    };
    if (data.password?.trim()) payload.password = data.password.trim();
    setSubmittingEditUser(true);
    try {
      await usersService.updateUser(editUserId, payload);
      showSuccessToast("Usuário atualizado com sucesso!");
      const tid = editUserTenantId;
      setOpenEditUser(false);
      setEditUserId(null);
      setEditUserTenantId(null);
      editUserForm.reset(getEditUserDefault(null));
      refetchTenants();
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao atualizar usuário");
    } finally {
      setSubmittingEditUser(false);
    }
  };

  const userToUpdateDto = (u: User, status: "active" | "inactive"): UpdateUserDto => ({
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    address: u.address ?? "",
    role: u.role,
    status,
  });

  const handleActivateUser = async (u: User) => {
    try {
      await usersService.updateUser(u.id, userToUpdateDto(u, "active"));
      showSuccessToast("Usuário ativado com sucesso!");
      refetchTenants();
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao ativar usuário");
    }
  };

  const handleDeactivateUser = async (u: User) => {
    try {
      await usersService.updateUser(u.id, userToUpdateDto(u, "inactive"));
      showSuccessToast("Usuário desativado com sucesso!");
      refetchTenants();
      setDeactivateUser(null);
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao desativar usuário");
    }
  };

  const toggleShowInactive = (tenantId: string) => {
    setShowInactiveForTenant((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) next.delete(tenantId);
      else next.add(tenantId);
      return next;
    });
  };

  const handleToggleBlockSale = async (tenant: Tenant) => {
    try {
      const newValue = !tenant.blockSaleWhenOutOfStock;
      await tenantsService.updateTenant(tenant.id, {
        blockSaleWhenOutOfStock: newValue,
      });
      showSuccessToast(
        newValue
          ? "Vendas bloqueadas quando sem estoque ativado"
          : "Vendas bloqueadas quando sem estoque desativado"
      );
      refetchTenants();
    } catch (err) {
      showErrorToast((err as Error)?.message ?? "Erro ao atualizar configuração");
    }
  };

  useEffect(() => {
    if (!isAdmin) navigate("/", { replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header - same pattern as ClientsPage */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Gerenciamento</h1>
              <p className="text-slate-300 mt-1">Tenants e usuários</p>
            </div>
          </div>
          <ConfirmDiscardDialog
            open={confirmDiscardTenant}
            onOpenChange={setConfirmDiscardTenant}
            onConfirm={handleConfirmDiscardTenant}
          />
          <Dialog open={openCreateTenant} onOpenChange={handleCloseCreateTenant}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo tenant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  placeholder="Nome do tenant"
                  {...tenantForm.register("name")}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={tenantForm.watch("type") || "kds"}
                    onValueChange={(v) => tenantForm.setValue("type", v as "kds" | "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kds">KDS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSubmitCreateTenant}
                  disabled={
                    submittingTenant ||
                    !tenantForm.watch("name")?.trim()
                  }
                >
                  {submittingTenant ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar tenant"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome do tenant..."
          className={search ? "pl-10 pr-10" : "pl-10"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearch("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      {tenantsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{(tenantsError as Error)?.message}</AlertDescription>
        </Alert>
      )}

      {tenantsLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
            <p className="text-muted-foreground">Carregando tenants...</p>
          </CardContent>
        </Card>
      ) : filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search
                ? "Nenhum tenant corresponde à busca."
                : "Nenhum tenant ainda. Adicione o primeiro."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 dark:bg-slate-800">
                  <TableHead className="w-[50px]" />
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold text-center">Usuários</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => {
                  const isExpanded = expandedRows.has(tenant.id);
                  const allUsers = tenant.users ?? [];
                  const activeUsers = allUsers.filter((u) => (u.status ?? "active") === "active");
                  const inactiveUsers = allUsers.filter((u) => u.status === "inactive");
                  const showingInactive = showInactiveForTenant.has(tenant.id);
                  const usersToShow = showingInactive ? [...activeUsers, ...inactiveUsers] : activeUsers;

                  return (
                    <Fragment key={tenant.id}>
                      <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRow(tenant.id)}
                            className="h-8 w-8"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-semibold">{tenant.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.type ?? "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {activeUsers.length > 0 ? activeUsers.length : "—"}
                        </TableCell>
                        <TableCell className="text-right" />
                      </TableRow>
                      {isExpanded && (
                        <TableRow
                          key={`${tenant.id}-details`}
                          className="bg-card hover:bg-card"
                        >
                          <TableCell colSpan={5} className="p-6">
                            <div className="space-y-6">
                              {/* Tenant Settings Section */}
                              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
                                  Configurações
                                </h4>
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                      Bloquear vendas quando sem estoque
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                      Quando ativado, impede a criação de pedidos quando não há estoque suficiente. 
                                      Quando desativado, permite vendas e o estoque pode ficar negativo.
                                    </p>
                                  </div>
                                  <Switch
                                    checked={tenant.blockSaleWhenOutOfStock ?? false}
                                    onCheckedChange={() => handleToggleBlockSale(tenant)}
                                  />
                                </div>
                              </div>

                              {/* Users Section */}
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                  Usuários ({usersToShow.length})
                                  {showingInactive && inactiveUsers.length > 0 && (
                                    <span className="text-muted-foreground font-normal ml-1">
                                      — {activeUsers.length} ativos, {inactiveUsers.length} inativos
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {inactiveUsers.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleShowInactive(tenant.id)}
                                    >
                                      {showingInactive ? (
                                        <>
                                          <EyeOff className="w-4 h-4 mr-2" />
                                          Ocultar inativos
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-4 h-4 mr-2" />
                                          Mostrar inativos
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAddUserModal(tenant.id)}
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Adicionar usuário
                                  </Button>
                                </div>
                              </div>
                              {usersToShow.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                  Nenhum usuário. Adicione o primeiro.
                                </p>
                              ) : (
                                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-card">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-100 dark:bg-slate-800">
                                        <TableHead className="font-semibold">Nome</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">Telefone</TableHead>
                                        <TableHead className="font-semibold">Role</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold text-right">Ações</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {usersToShow.map((u) => (
                                        <TableRow
                                          key={u.id}
                                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                          <TableCell className="font-medium">{u.name}</TableCell>
                                          <TableCell className="text-sm">{u.email}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            {u.phone ?? "—"}
                                          </TableCell>
                                          <TableCell>
                                            <span className="text-xs font-medium capitalize">
                                              {u.role ?? "—"}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={`text-xs font-medium ${
                                                (u.status ?? "active") === "active"
                                                  ? "text-green-600 dark:text-green-500"
                                                  : "text-red-600 dark:text-red-500"
                                              }`}
                                            >
                                              {(u.status ?? "active") === "active" ? "Ativo" : "Inativo"}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEditUser(u, tenant.id)}
                                                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900"
                                              >
                                                <Pencil className="w-4 h-4" />
                                              </Button>
                                              {(u.status ?? "active") === "active" ? (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => setDeactivateUser(u)}
                                                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
                                                  title="Desativar usuário"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              ) : (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => handleActivateUser(u)}
                                                  className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-600"
                                                  title="Ativar usuário"
                                                >
                                                  <UserCheck className="w-4 h-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create User Modal */}
      <ConfirmDiscardDialog
        open={confirmDiscardCreateUser}
        onOpenChange={setConfirmDiscardCreateUser}
        onConfirm={handleConfirmDiscardCreateUser}
      />
      <Dialog open={openCreateUser} onOpenChange={handleCloseCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Nome" {...createUserForm.register("name")} />
            <Input
              placeholder="Email"
              type="email"
              {...createUserForm.register("email")}
            />
            <Input placeholder="Telefone (opcional)" {...createUserForm.register("phone")} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Endereço (opcional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Endereço"
                {...createUserForm.register("address")}
              />
            </div>
            <Input
              type="password"
              placeholder="Senha"
              {...createUserForm.register("password")}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Função</label>
              <Select
                value={createUserForm.watch("role") || "manager"}
                onValueChange={(v) => createUserForm.setValue("role", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCloseCreateUser(false)}
                disabled={submittingCreateUser}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitCreateUser}
                disabled={
                  submittingCreateUser ||
                  !createUserForm.watch("name")?.trim() ||
                  !createUserForm.watch("email")?.trim() ||
                  !createUserForm.watch("password")?.trim()
                }
              >
                {submittingCreateUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar usuário"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm deactivate user */}
      <ConfirmActionDialog
        open={deactivateUser !== null}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        onConfirm={() => deactivateUser && handleDeactivateUser(deactivateUser)}
        title="Desativar usuário?"
        description="Tem certeza que deseja desativar este usuário? Ele não poderá acessar o sistema até ser ativado novamente."
        confirmLabel="Desativar"
        variant="destructive"
      />

      {/* Edit User Modal - same pattern as Profile */}
      <ConfirmDiscardDialog
        open={confirmDiscardEditUser}
        onOpenChange={setConfirmDiscardEditUser}
        onConfirm={handleConfirmDiscardEditUser}
      />
      <Dialog open={openEditUser} onOpenChange={handleCloseEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Nome" {...editUserForm.register("name")} />
            <Input
              placeholder="Email"
              type="email"
              {...editUserForm.register("email")}
            />
            <Input placeholder="Telefone (opcional)" {...editUserForm.register("phone")} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Endereço (opcional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Endereço"
                {...editUserForm.register("address")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nova senha (opcional)</label>
              <Input
                type="password"
                placeholder="Deixe em branco para não alterar"
                {...editUserForm.register("password")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Função</label>
              <Select
                value={editUserForm.watch("role") || "manager"}
                onValueChange={(v) => editUserForm.setValue("role", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCloseEditUser(false)}
                disabled={submittingEditUser}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitEditUser}
                disabled={
                  submittingEditUser ||
                  !editUserForm.watch("name")?.trim() ||
                  !editUserForm.watch("email")?.trim() ||
                  !editUserForm.formState.isDirty
                }
              >
                {submittingEditUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

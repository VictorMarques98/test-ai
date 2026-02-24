import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Pencil, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { profileService } from "@/services/profileService";
import type { User as UserType, UpdateUserDto } from "@/types/api";

type ProfileFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

function getDefaultValues(profile: UserType | null): ProfileFormValues {
  return {
    name: profile?.name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    password: "",
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    defaultValues: getDefaultValues(null),
  });
  const { formState, getValues, reset } = form;
  const isDirty = formState.isDirty;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    profileService
      .getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error)?.message ?? "Erro ao carregar perfil");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    reset(getDefaultValues(profile));
  };

  const handleOpenEdit = () => {
    reset(getDefaultValues(profile));
    setOpen(true);
  };

  const handleCloseEditDialog = (v: boolean) => {
    if (!v) {
      if (isDirty) setConfirmDiscardOpen(true);
      else {
        setOpen(false);
        resetForm();
      }
    } else {
      setOpen(v);
    }
  };

  const handleConfirmDiscard = () => {
    setOpen(false);
    resetForm();
    setConfirmDiscardOpen(false);
  };

  const handleSubmit = async () => {
    const data = getValues();
    const payload: UpdateUserDto = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
    };
    if (data.password?.trim()) {
      payload.password = data.password.trim();
    }

    setSubmitting(true);
    try {
      const updated = await profileService.updateProfile(payload);
      setProfile(updated);
      showSuccessToast("Perfil atualizado com sucesso!");
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      showErrorToast((err as Error)?.message ?? "Erro ao atualizar perfil");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-lg p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
              <p className="text-slate-300 mt-1">Visualize e edite seus dados</p>
            </div>
          </div>
          <Button
            size="lg"
            className="shadow-lg shrink-0"
            onClick={handleOpenEdit}
            disabled={loading || !!error || !profile}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar perfil
          </Button>
        </div>
      </div>

      <ConfirmDiscardDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
        onConfirm={handleConfirmDiscard}
      />

      <Dialog open={open} onOpenChange={handleCloseEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Nome" {...form.register("name", { required: true })} />
            <Input
              placeholder="Email"
              type="email"
              {...form.register("email", { required: true })}
            />
            <Input placeholder="Telefone (opcional)" {...form.register("phone")} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Endereço (opcional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Endereço"
                {...form.register("address")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nova senha (opcional)</label>
              <Input
                type="password"
                placeholder="Nova senha (deixe em branco para não alterar)"
                {...form.register("password")}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleCloseEditDialog(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !form.watch("name")?.trim() ||
                  !form.watch("email")?.trim() ||
                  !isDirty
                }
              >
                {submitting ? (
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

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && profile && (
        <Card>
          <CardContent className="pt-6">
            <dl className="grid gap-4 sm:grid-cols-1">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
                <dd className="mt-1 text-base">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 text-base">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Telefone</dt>
                <dd className="mt-1 text-base">{profile.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Endereço</dt>
                <dd className="mt-1 text-base">{profile.address ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

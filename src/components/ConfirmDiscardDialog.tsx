import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Tem certeza que deseja sair?",
  description = "Os dados não serão salvos.",
}: ConfirmDiscardDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="px-8 pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 p-4 mb-5">
              <AlertTriangle className="h-9 w-9 text-amber-600 dark:text-amber-500" strokeWidth={2} />
            </div>
            <DialogHeader className="space-y-2.5 px-0">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-3 px-8 pb-8 pt-0">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-xl font-medium"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1 rounded-xl font-medium"
            onClick={handleConfirm}
          >
            Descartar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { AlertDialog } from "@heroui/react";
import { Button } from "@/components/ui/button";

export function Confirmar({
  rotulo,
  titulo,
  confirmar,
  ocupado,
  aoConfirmar,
}: {
  rotulo: string;
  titulo: string;
  confirmar: string;
  ocupado?: boolean;
  aoConfirmar: () => void;
}) {
  return (
    <AlertDialog>
      <Button type="button" variant="outline" disabled={ocupado}>
        {rotulo}
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{titulo}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <Button slot="close" type="button" variant="tertiary">
                Voltar
              </Button>
              <Button slot="close" type="button" variant="danger" onClick={aoConfirmar}>
                {confirmar}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

"use client";

import { useState, type Key } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, Dropdown } from "@heroui/react";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AcaoMenu = {
  id: string;
  rotulo: string;
  href?: string;
  perigo?: boolean;
  confirmar?: string;
  aoConfirmar?: () => void | Promise<void>;
};

export function MenuAcoes({ rotulo, acoes }: { rotulo: string; acoes: AcaoMenu[] }) {
  const router = useRouter();
  const [pendente, setPendente] = useState<AcaoMenu | null>(null);

  function escolher(chave: Key) {
    const acao = acoes.find((item) => item.id === String(chave));
    if (!acao) return;
    if (acao.confirmar) {
      setPendente(acao);
      return;
    }
    if (acao.href) router.push(acao.href);
    void acao.aoConfirmar?.();
  }

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger
          aria-label={rotulo}
          className="inline-flex size-8 items-center justify-center rounded-lg text-foreground hover:bg-default"
        >
          <EllipsisVertical className="size-4" aria-hidden />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label={rotulo} onAction={escolher}>
            {acoes.map((acao) => (
              <Dropdown.Item key={acao.id} id={acao.id} textValue={acao.rotulo} variant={acao.perigo ? "danger" : "default"}>
                {acao.rotulo}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <AlertDialog isOpen={pendente != null} onOpenChange={(aberto) => { if (!aberto) setPendente(null); }}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>{pendente?.confirmar}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <Button slot="close" type="button" variant="tertiary">
                  Voltar
                </Button>
                <Button
                  slot="close"
                  type="button"
                  variant="danger"
                  onClick={() => {
                    const acao = pendente;
                    setPendente(null);
                    void acao?.aoConfirmar?.();
                  }}
                >
                  {pendente?.rotulo}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}

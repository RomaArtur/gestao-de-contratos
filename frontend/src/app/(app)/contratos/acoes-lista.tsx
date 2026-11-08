"use client";

import { useState, useTransition } from "react";
import { MenuAcoes, type AcaoMenu } from "@/components/ui/menu-acoes";
import { excluirContrato, reenviarContrato } from "./actions";

export function AcoesListaContrato({
  id,
  codigo,
  situacao,
  temDocumento,
  clienteTemEmail,
  podeEscrever,
}: {
  id: string;
  codigo: string;
  situacao: string;
  temDocumento: boolean;
  clienteTemEmail: boolean;
  podeEscrever: boolean;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function reenviar() {
    setErro(null);
    setAviso(null);
    iniciar(async () => {
      const resposta = await reenviarContrato(id);
      if (!resposta || "error" in resposta) {
        setErro(resposta?.error ?? "Não foi possível reenviar o contrato.");
        return;
      }
      setAviso(`Contrato enviado para ${resposta.email}.`);
    });
  }

  const acoes: AcaoMenu[] = [
    {
      id: "ver",
      rotulo: "Visualizar",
      href: temDocumento ? `/contratos/${id}?aba=documento` : `/contratos/${id}?aba=documentos`,
    },
  ];
  if (podeEscrever && temDocumento && situacao !== "MINUTA" && clienteTemEmail) {
    acoes.push({
      id: "reenviar",
      rotulo: "Reenviar contrato",
      confirmar: `Reenviar ${codigo}?`,
      aoConfirmar: reenviar,
    });
  }
  if (podeEscrever && situacao === "MINUTA") {
    acoes.push({
      id: "excluir",
      rotulo: "Excluir",
      perigo: true,
      confirmar: `Excluir ${codigo}?`,
      aoConfirmar: () => {
        setErro(null);
        iniciar(async () => {
          const resposta = await excluirContrato(id);
          if (resposta && "error" in resposta) setErro(resposta.error);
        });
      },
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <MenuAcoes rotulo={`Ações de ${codigo}`} acoes={acoes} />
      {pendente ? <p className="text-xs text-muted">Aguarde…</p> : null}
      {erro ? <p className="text-xs text-danger">{erro}</p> : null}
      {aviso ? <p className="text-xs text-muted">{aviso}</p> : null}
    </div>
  );
}

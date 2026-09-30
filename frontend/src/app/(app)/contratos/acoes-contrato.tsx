"use client";

import { useState } from "react";
import { Input, Label, TextField } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { ativarContrato, cancelarContrato, encerrarContrato, excluirContrato } from "./actions";

export function AcoesContrato({ id, situacao }: { id: string; situacao: string }) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function executar(acao: () => Promise<{ error: string } | undefined>) {
    setErro(null);
    setOcupado(true);
    try {
      const resultado = await acao();
      if (resultado?.error) setErro(resultado.error);
    } finally {
      setOcupado(false);
    }
  }

  if (situacao !== "MINUTA" && situacao !== "VIGENTE") return null;

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {ocupado ? <Indicador rotulo="Atualizando" indeterminado /> : null}
        {situacao === "MINUTA" ? (
          <>
            <Button type="button" disabled={ocupado} onClick={() => executar(() => ativarContrato(id))}>
              Ativar
            </Button>
            <Confirmar
              rotulo="Excluir"
              titulo="Excluir contrato?"
              confirmar="Excluir"
              ocupado={ocupado}
              aoConfirmar={() => executar(() => excluirContrato(id))}
            />
          </>
        ) : null}
        {situacao === "VIGENTE" ? (
          <Confirmar
            rotulo="Encerrar"
            titulo="Encerrar contrato?"
            confirmar="Encerrar"
            ocupado={ocupado}
            aoConfirmar={() => executar(() => encerrarContrato(id))}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <TextField className="min-w-64 flex-1" value={motivo} onChange={setMotivo}>
          <Label>Motivo</Label>
          <Input />
        </TextField>
        <Confirmar
          rotulo="Cancelar"
          titulo="Cancelar contrato?"
          confirmar="Cancelar"
          ocupado={ocupado}
          aoConfirmar={() => executar(() => cancelarContrato(id, motivo))}
        />
      </div>
      {erro ? <p className="text-sm text-danger">{erro}</p> : null}
    </div>
  );
}

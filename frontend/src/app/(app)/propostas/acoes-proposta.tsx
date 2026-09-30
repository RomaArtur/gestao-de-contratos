"use client";

import { useState } from "react";
import { Input, Label, TextField } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { aceitarProposta, cancelarProposta, enviarProposta, excluirProposta, recusarProposta } from "./actions";

export function AcoesProposta({ id, situacao }: { id: string; situacao: string }) {
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

  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {ocupado ? <Indicador rotulo="Atualizando" indeterminado /> : null}
        {situacao === "RASCUNHO" ? (
          <>
            <Button type="button" disabled={ocupado} onClick={() => executar(() => enviarProposta(id))}>
              Enviar
            </Button>
            <Confirmar
              rotulo="Excluir"
              titulo="Excluir proposta?"
              confirmar="Excluir"
              ocupado={ocupado}
              aoConfirmar={() => executar(() => excluirProposta(id))}
            />
          </>
        ) : null}
        {situacao === "ENVIADA" ? (
          <Button type="button" disabled={ocupado} onClick={() => executar(() => aceitarProposta(id))}>
            Aceitar
          </Button>
        ) : null}
      </div>
      {situacao === "RASCUNHO" || situacao === "ENVIADA" ? (
        <div className="flex flex-wrap items-end gap-2">
          <TextField className="min-w-64 flex-1" value={motivo} onChange={setMotivo}>
            <Label>Motivo</Label>
            <Input />
          </TextField>
          {situacao === "ENVIADA" ? (
            <Confirmar
              rotulo="Recusar"
              titulo="Recusar proposta?"
              confirmar="Recusar"
              ocupado={ocupado}
              aoConfirmar={() => executar(() => recusarProposta(id, motivo))}
            />
          ) : null}
          <Confirmar
            rotulo="Cancelar"
            titulo="Cancelar proposta?"
            confirmar="Cancelar"
            ocupado={ocupado}
            aoConfirmar={() => executar(() => cancelarProposta(id, motivo))}
          />
        </div>
      ) : null}
      {erro ? <p className="text-sm text-danger">{erro}</p> : null}
    </div>
  );
}

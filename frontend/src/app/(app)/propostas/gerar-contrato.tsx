"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CampoPeriodo } from "@/components/ui/campo-periodo";
import { gerarContrato } from "./actions";

export function GerarContrato({ id }: { id: string }) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <div className="flex max-w-3xl flex-col items-start gap-3">
      <p className="text-sm text-muted">
        O contrato usa o modelo da forma de pagamento da proposta e preenche somente os dados já cadastrados.
        A validade da proposta permanece no texto. O período abaixo é a vigência do contrato.
      </p>
      <CampoPeriodo
        inicio={inicio}
        fim={fim}
        erro={erro ?? undefined}
        desabilitado={pendente}
        aoMudar={(novoInicio, novoFim) => {
          setInicio(novoInicio);
          setFim(novoFim);
          setErro(null);
        }}
      />
      <Button
        type="button"
        disabled={pendente}
        onClick={() => {
          if (inicio.length < 10 || fim.length < 10) {
            setErro("Informe o início e o vencimento do contrato.");
            return;
          }
          if (fim < inicio) {
            setErro("O vencimento precisa ser igual ou posterior ao início.");
            return;
          }
          setErro(null);
          iniciar(async () => {
            const resposta = await gerarContrato(id, { dataInicio: inicio, vencimento: fim });
            if (resposta && "error" in resposta) setErro(resposta.error);
          });
        }}
      >
        Gerar contrato
      </Button>
    </div>
  );
}

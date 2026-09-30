"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, Label, TextArea, TextField } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { CampoLista } from "@/components/ui/campo-lista";
import { CampoPeriodo } from "@/components/ui/campo-periodo";
import { Indicador } from "@/components/ui/indicador";
import { salvarContrato } from "./actions";

const schema = z
  .object({
    propostaId: z.string().uuid("Selecione a proposta.").optional().or(z.literal("")),
    dataInicio: z.string().min(10, "Informe o início."),
    vencimento: z.string().min(10, "Informe o vencimento."),
    observacoes: z.string().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.vencimento && valor.dataInicio && valor.vencimento < valor.dataInicio) {
      ctx.addIssue({ code: "custom", path: ["vencimento"], message: "O vencimento precisa ser igual ou posterior ao início." });
    }
  });

type ValoresFormulario = z.infer<typeof schema>;

export type OpcaoProposta = { id: string; rotulo: string };

export function FormularioContrato({
  contratoId,
  somenteLeitura,
  propostas,
  valoresIniciais,
}: {
  contratoId?: string;
  somenteLeitura?: boolean;
  propostas?: OpcaoProposta[];
  valoresIniciais: ValoresFormulario;
}) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({ resolver: zodResolver(schema), defaultValues: valoresIniciais });

  async function aoEnviar(valores: ValoresFormulario) {
    setErroServidor(null);
    if (!contratoId && !valores.propostaId) {
      setErroServidor("Selecione a proposta.");
      return;
    }
    const resultado = await salvarContrato(
      contratoId ?? null,
      contratoId
        ? {
            dataInicio: valores.dataInicio,
            vencimento: valores.vencimento,
            observacoes: valores.observacoes,
          }
        : {
            propostaId: valores.propostaId ?? "",
            dataInicio: valores.dataInicio,
            vencimento: valores.vencimento,
            observacoes: valores.observacoes,
          },
    );
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      {propostas ? (
        <CampoLista
          rotulo="Proposta"
          itens={propostas}
          valor={watch("propostaId")}
          erro={errors.propostaId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("propostaId", valor, { shouldValidate: true })}
        />
      ) : null}
      <CampoPeriodo
        inicio={watch("dataInicio")}
        fim={watch("vencimento")}
        erro={errors.dataInicio?.message ?? errors.vencimento?.message}
        desabilitado={somenteLeitura}
        aoMudar={(inicio, fim) => {
          setValue("dataInicio", inicio, { shouldValidate: true });
          setValue("vencimento", fim, { shouldValidate: true });
        }}
      />
      <TextField fullWidth isInvalid={Boolean(errors.observacoes)}>
        <Label>Observações</Label>
        <TextArea disabled={somenteLeitura} rows={4} {...register("observacoes")} />
        {errors.observacoes ? <FieldError>{errors.observacoes.message}</FieldError> : null}
      </TextField>
      {erroServidor ? <p className="text-sm text-danger">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : contratoId ? "Salvar" : "Gerar"}
        </Button>
      )}
    </form>
  );
}

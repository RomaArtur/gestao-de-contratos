"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, Label, TextArea, TextField } from "@heroui/react";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { CampoLista } from "@/components/ui/campo-lista";
import { CampoNumero } from "@/components/ui/campo-numero";
import { CampoPeriodo } from "@/components/ui/campo-periodo";
import { Indicador } from "@/components/ui/indicador";
import { salvarContrato } from "./actions";

const schema = z
  .object({
    propostaId: z.string().optional(),
    imovelId: z.string().optional(),
    clienteId: z.string().optional(),
    finalidade: z.enum(["VENDA", "ALUGUEL"]),
    valor: z.coerce.number().optional(),
    formaPagamentoId: z.string().optional(),
    dataInicio: z.string().min(10, "Informe o início."),
    vencimento: z.string().min(10, "Informe o vencimento."),
    observacoes: z.string().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.vencimento && valor.dataInicio && valor.vencimento < valor.dataInicio) {
      ctx.addIssue({ code: "custom", path: ["vencimento"], message: "O vencimento precisa ser igual ou posterior ao início." });
    }
    if (valor.propostaId) return;
    if (!valor.imovelId) ctx.addIssue({ code: "custom", path: ["imovelId"], message: "Selecione o imóvel." });
    if (!valor.clienteId) ctx.addIssue({ code: "custom", path: ["clienteId"], message: "Selecione o cliente." });
    if (!valor.valor || valor.valor <= 0) ctx.addIssue({ code: "custom", path: ["valor"], message: "Informe o valor." });
  });

type ValoresFormulario = z.infer<typeof schema>;

export type Opcao = { id: string; rotulo: string };
export type OpcaoProposta = Opcao & {
  imovelId: string;
  clienteId: string;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  formaPagamentoId: string | null;
};

export function FormularioContrato({
  contratoId,
  somenteLeitura,
  vinculadoAProposta,
  propostas,
  imoveis,
  clientes,
  formas,
  valoresIniciais,
}: {
  contratoId?: string;
  somenteLeitura?: boolean;
  vinculadoAProposta?: boolean;
  propostas?: OpcaoProposta[];
  imoveis: Opcao[];
  clientes: Opcao[];
  formas: Opcao[];
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
  const propostaId = watch("propostaId");
  const travarVinculos = Boolean(somenteLeitura || vinculadoAProposta || propostaId);

  function escolherProposta(valor: string) {
    setValue("propostaId", valor, { shouldValidate: true });
    const proposta = propostas?.find((item) => item.id === valor);
    if (!proposta) return;
    setValue("imovelId", proposta.imovelId, { shouldValidate: true });
    setValue("clienteId", proposta.clienteId, { shouldValidate: true });
    setValue("finalidade", proposta.finalidade, { shouldValidate: true });
    setValue("valor", proposta.valor, { shouldValidate: true });
    if (proposta.formaPagamentoId) setValue("formaPagamentoId", proposta.formaPagamentoId, { shouldValidate: true });
  }

  async function aoEnviar(valores: ValoresFormulario) {
    setErroServidor(null);
    const valor = Number(valores.valor);
    const comum = {
      dataInicio: valores.dataInicio,
      vencimento: valores.vencimento,
      observacoes: valores.observacoes,
      formaPagamentoId: valores.formaPagamentoId || "",
      ...(valor > 0 ? { valor } : {}),
    };
    const resultado = await salvarContrato(
      contratoId ?? null,
      valores.propostaId && !contratoId
        ? { ...comum, propostaId: valores.propostaId }
        : contratoId
          ? {
              ...comum,
              ...(vinculadoAProposta
                ? {}
                : {
                    imovelId: valores.imovelId,
                    clienteId: valores.clienteId,
                    finalidade: valores.finalidade,
                  }),
            }
          : {
              ...comum,
              imovelId: valores.imovelId ?? "",
              clienteId: valores.clienteId ?? "",
              finalidade: valores.finalidade,
            },
    );
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      {propostas ? (
        <CampoLista
          rotulo="Proposta aceita"
          itens={propostas}
          valor={watch("propostaId")}
          erro={errors.propostaId?.message}
          desabilitado={somenteLeitura}
          aoMudar={escolherProposta}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <CampoLista
          rotulo="Imóvel"
          itens={imoveis}
          valor={watch("imovelId")}
          erro={errors.imovelId?.message}
          desabilitado={travarVinculos}
          aoMudar={(valor) => setValue("imovelId", valor, { shouldValidate: true })}
        />
        <CampoLista
          rotulo="Cliente"
          itens={clientes}
          valor={watch("clienteId")}
          erro={errors.clienteId?.message}
          desabilitado={travarVinculos}
          aoMudar={(valor) => setValue("clienteId", valor, { shouldValidate: true })}
        />
        <Field label="Finalidade" error={errors.finalidade?.message}>
          <select className={controlClass} disabled={travarVinculos} {...register("finalidade")}>
            <option value="VENDA">Venda</option>
            <option value="ALUGUEL">Aluguel</option>
          </select>
        </Field>
        <CampoNumero
          rotulo="Valor"
          moeda
          valor={watch("valor")}
          erro={errors.valor?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("valor", valor, { shouldValidate: true })}
        />
        <CampoLista
          rotulo="Forma de pagamento"
          itens={formas}
          valor={watch("formaPagamentoId")}
          erro={errors.formaPagamentoId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("formaPagamentoId", valor, { shouldValidate: true })}
        />
      </div>
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
          {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : contratoId ? "Salvar" : "Cadastrar"}
        </Button>
      )}
    </form>
  );
}

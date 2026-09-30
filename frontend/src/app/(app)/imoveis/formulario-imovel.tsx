"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, TextArea } from "@heroui/react";
import { CamposEndereco } from "@/components/campos-endereco";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { CampoLista } from "@/components/ui/campo-lista";
import { CampoNumero } from "@/components/ui/campo-numero";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { finalidades, situacoes, tiposImovel } from "@/lib/labels";
import { excluirImovel, salvarImovel, type DadosImovel } from "./actions";

const schema = z
  .object({
    codigo: z.string().min(1, "Informe o código."),
    proprietarioId: z.string().uuid("Selecione o proprietário."),
    tipo: z.string().min(1),
    finalidade: z.enum(["VENDA", "ALUGUEL", "VENDA_ALUGUEL"]),
    situacao: z.string().min(1),
    area: z.string().min(1, "Informe a área."),
    quartos: z.string(),
    banheiros: z.string(),
    vagas: z.string(),
    descricao: z.string().optional(),
    valorVenda: z.string().optional(),
    valorAluguel: z.string().optional(),
    valorCondominio: z.string().optional(),
    valorIptu: z.string().optional(),
    endereco: z.object({
      cep: z.string().min(8, "Informe o CEP."),
      logradouro: z.string().min(1, "Informe o logradouro."),
      numero: z.string().min(1, "Informe o número."),
      complemento: z.string().optional(),
      bairro: z.string().min(1, "Informe o bairro."),
      cidade: z.string().min(1, "Informe a cidade."),
      uf: z.string().length(2, "Informe a UF."),
    }),
  })
  .superRefine((valores, ctx) => {
    const exigeVenda = valores.finalidade === "VENDA" || valores.finalidade === "VENDA_ALUGUEL";
    const exigeAluguel = valores.finalidade === "ALUGUEL" || valores.finalidade === "VENDA_ALUGUEL";
    if (exigeVenda && !valores.valorVenda) {
      ctx.addIssue({ code: "custom", path: ["valorVenda"], message: "Informe o valor de venda." });
    }
    if (exigeAluguel && !valores.valorAluguel) {
      ctx.addIssue({ code: "custom", path: ["valorAluguel"], message: "Informe o valor de aluguel." });
    }
  });

type ValoresFormulario = z.infer<typeof schema>;

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function valor(entrada?: string) {
  if (!entrada) return null;
  const convertido = Number(entrada);
  return Number.isFinite(convertido) ? convertido : null;
}

function numero(entrada?: string) {
  const convertido = valor(entrada);
  return convertido == null ? undefined : convertido;
}

export function FormularioImovel({
  imovelId,
  somenteLeitura,
  proprietarios,
  valoresIniciais,
}: {
  imovelId?: string;
  somenteLeitura?: boolean;
  proprietarios: { id: string; nome: string }[];
  valoresIniciais: ValoresFormulario;
}) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({ resolver: zodResolver(schema), defaultValues: valoresIniciais });

  async function aoEnviar(valores: ValoresFormulario) {
    setErroServidor(null);
    const dados: DadosImovel = {
      codigo: valores.codigo,
      proprietarioId: valores.proprietarioId,
      tipo: valores.tipo,
      finalidade: valores.finalidade,
      situacao: valores.situacao,
      area: Number(valores.area),
      quartos: Number(valores.quartos || 0),
      banheiros: Number(valores.banheiros || 0),
      vagas: Number(valores.vagas || 0),
      descricao: valores.descricao,
      valorVenda: valor(valores.valorVenda),
      valorAluguel: valor(valores.valorAluguel),
      valorCondominio: valor(valores.valorCondominio),
      valorIptu: valor(valores.valorIptu),
      endereco: {
        ...valores.endereco,
        cep: digitos(valores.endereco.cep),
        uf: valores.endereco.uf.toUpperCase(),
      },
    };
    const resultado = await salvarImovel(imovelId ?? null, dados);
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Código" error={errors.codigo?.message}>
          <Input disabled={somenteLeitura} {...register("codigo")} />
        </Field>
        <CampoLista
          rotulo="Proprietário"
          itens={proprietarios.map((proprietario) => ({ id: proprietario.id, rotulo: proprietario.nome }))}
          valor={watch("proprietarioId")}
          erro={errors.proprietarioId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("proprietarioId", valor, { shouldValidate: true })}
        />
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <select id="tipo" className={controlClass} disabled={somenteLeitura} {...register("tipo")}>
            {tiposImovel.map(([valorOpcao, rotulo]) => <option key={valorOpcao} value={valorOpcao}>{rotulo}</option>)}
          </select>
        </Field>
        <Field label="Finalidade" htmlFor="finalidade" error={errors.finalidade?.message}>
          <select id="finalidade" className={controlClass} disabled={somenteLeitura} {...register("finalidade")}>
            {finalidades.map(([valorOpcao, rotulo]) => <option key={valorOpcao} value={valorOpcao}>{rotulo}</option>)}
          </select>
        </Field>
        <Field label="Status" htmlFor="situacao" error={errors.situacao?.message}>
          <select id="situacao" className={controlClass} disabled={somenteLeitura} {...register("situacao")}>
            {situacoes.map(([valorOpcao, rotulo]) => <option key={valorOpcao} value={valorOpcao}>{rotulo}</option>)}
          </select>
        </Field>
        <CampoNumero rotulo="Área (m²)" valor={numero(watch("area"))} erro={errors.area?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("area", String(valor), { shouldValidate: true })} />
        <CampoNumero rotulo="Quartos" valor={numero(watch("quartos"))} erro={errors.quartos?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("quartos", String(valor))} />
        <CampoNumero rotulo="Banheiros" valor={numero(watch("banheiros"))} erro={errors.banheiros?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("banheiros", String(valor))} />
        <CampoNumero rotulo="Vagas" valor={numero(watch("vagas"))} erro={errors.vagas?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("vagas", String(valor))} />
        <CampoNumero rotulo="Valor de venda" moeda valor={numero(watch("valorVenda"))} erro={errors.valorVenda?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("valorVenda", valor ? String(valor) : "", { shouldValidate: true })} />
        <CampoNumero rotulo="Valor de aluguel" moeda valor={numero(watch("valorAluguel"))} erro={errors.valorAluguel?.message} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("valorAluguel", valor ? String(valor) : "", { shouldValidate: true })} />
        <CampoNumero rotulo="Condomínio" moeda valor={numero(watch("valorCondominio"))} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("valorCondominio", valor ? String(valor) : "")} />
        <CampoNumero rotulo="IPTU" moeda valor={numero(watch("valorIptu"))} desabilitado={somenteLeitura} aoMudar={(valor) => setValue("valorIptu", valor ? String(valor) : "")} />
      </div>
      <Field label="Descrição" error={errors.descricao?.message}>
        <TextArea rows={4} disabled={somenteLeitura} {...register("descricao")} />
      </Field>
      <CamposEndereco register={register} errors={errors} setValue={setValue} />
      {erroServidor ? <p className="text-sm text-danger" role="alert">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : "Salvar"}
          </Button>
          {imovelId ? (
            <Confirmar
              rotulo="Excluir"
              titulo="Excluir imóvel?"
              confirmar="Excluir"
              aoConfirmar={async () => {
                const resultado = await excluirImovel(imovelId);
                if (resultado?.error) setErroServidor(resultado.error);
              }}
            />
          ) : null}
        </div>
      )}
    </form>
  );
}

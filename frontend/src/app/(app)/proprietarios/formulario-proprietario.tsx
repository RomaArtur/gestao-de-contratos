"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@heroui/react";
import { CamposEndereco } from "@/components/campos-endereco";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { CampoData } from "@/components/ui/campo-data";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { tiposPessoa } from "@/lib/labels";
import { excluirProprietario, salvarProprietario, type DadosProprietario } from "./actions";

const schema = z.object({
  tipoPessoa: z.enum(["FISICA", "JURIDICA"]),
  nome: z.string().min(3, "Informe o nome."),
  nomeFantasia: z.string().optional(),
  documento: z.string().min(11, "Informe o documento."),
  dataNascimento: z.string().optional(),
  telefone: z.string().min(8, "Informe o telefone."),
  email: z.string().email("E-mail inválido."),
  nomeResponsavel: z.string().optional(),
  endereco: z.object({
    cep: z.string().min(8, "Informe o CEP."),
    logradouro: z.string().min(1, "Informe o logradouro."),
    numero: z.string().min(1, "Informe o número."),
    complemento: z.string().optional(),
    bairro: z.string().min(1, "Informe o bairro."),
    cidade: z.string().min(1, "Informe a cidade."),
    uf: z.string().length(2, "Informe a UF."),
  }),
});

type ValoresFormulario = z.infer<typeof schema>;

function digitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function FormularioProprietario({
  proprietarioId,
  somenteLeitura,
  valoresIniciais,
}: {
  proprietarioId?: string;
  somenteLeitura?: boolean;
  valoresIniciais: ValoresFormulario;
}) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({ resolver: zodResolver(schema), defaultValues: valoresIniciais });
  const tipoPessoa = watch("tipoPessoa");

  async function aoEnviar(valores: ValoresFormulario) {
    setErroServidor(null);
    const dados: DadosProprietario = {
      ...valores,
      documento: digitos(valores.documento),
      endereco: {
        ...valores.endereco,
        cep: digitos(valores.endereco.cep),
        uf: valores.endereco.uf.toUpperCase(),
      },
    };
    const resultado = await salvarProprietario(proprietarioId ?? null, dados);
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <Field label="Tipo" htmlFor="tipoPessoa" error={errors.tipoPessoa?.message}>
        <select id="tipoPessoa" className={controlClass} disabled={somenteLeitura} {...register("tipoPessoa")}>
          {tiposPessoa.map(([valor, rotulo]) => (
            <option key={valor} value={valor}>{rotulo}</option>
          ))}
        </select>
      </Field>
      <Field label={tipoPessoa === "JURIDICA" ? "Razão social" : "Nome"} error={errors.nome?.message}>
        <Input disabled={somenteLeitura} {...register("nome")} />
      </Field>
      {tipoPessoa === "JURIDICA" ? (
        <>
          <Field label="Nome fantasia" error={errors.nomeFantasia?.message}>
            <Input disabled={somenteLeitura} {...register("nomeFantasia")} />
          </Field>
          <Field label="Responsável" error={errors.nomeResponsavel?.message}>
            <Input disabled={somenteLeitura} {...register("nomeResponsavel")} />
          </Field>
        </>
      ) : (
        <CampoData
          rotulo="Data de nascimento"
          valor={watch("dataNascimento")}
          erro={errors.dataNascimento?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("dataNascimento", valor, { shouldValidate: true })}
        />
      )}
      <Field label={tipoPessoa === "JURIDICA" ? "CNPJ" : "CPF"} error={errors.documento?.message}>
        <Input disabled={somenteLeitura} {...register("documento")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Telefone" error={errors.telefone?.message}>
          <Input disabled={somenteLeitura} {...register("telefone")} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input type="email" disabled={somenteLeitura} {...register("email")} />
        </Field>
      </div>
      <CamposEndereco register={register} errors={errors} setValue={setValue} />
      {erroServidor ? <p className="text-sm text-danger" role="alert">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : "Salvar"}
          </Button>
          {proprietarioId ? (
            <Confirmar
              rotulo="Excluir"
              titulo="Excluir proprietário?"
              confirmar="Excluir"
              aoConfirmar={async () => {
                const resultado = await excluirProprietario(proprietarioId);
                if (resultado?.error) setErroServidor(resultado.error);
              }}
            />
          ) : null}
        </div>
      )}
    </form>
  );
}

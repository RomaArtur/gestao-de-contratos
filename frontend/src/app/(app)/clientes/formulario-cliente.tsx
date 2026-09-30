"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CamposEndereco } from "@/components/campos-endereco";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { tiposCliente } from "@/lib/labels";
import { excluirCliente, salvarCliente, type DadosCliente } from "./actions";

const schema = z.object({
  nome: z.string().min(3, "Informe o nome."),
  documento: z.string().min(11, "Informe o CPF ou CNPJ."),
  telefone: z.string().min(8, "Informe o telefone."),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido."),
  tipo: z.enum(["COMPRADOR", "LOCATARIO", "INVESTIDOR", "EMPRESA", "OUTROS"]),
  observacoes: z.string().optional(),
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

export function FormularioCliente({
  clienteId,
  somenteLeitura,
  valoresIniciais,
}: {
  clienteId?: string;
  somenteLeitura?: boolean;
  valoresIniciais: ValoresFormulario;
}) {
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({ resolver: zodResolver(schema), defaultValues: valoresIniciais });

  async function aoEnviar(valores: ValoresFormulario) {
    setErroServidor(null);
    const dados: DadosCliente = {
      ...valores,
      documento: digitos(valores.documento),
      endereco: {
        ...valores.endereco,
        cep: digitos(valores.endereco.cep),
        uf: valores.endereco.uf.toUpperCase(),
      },
    };
    const resultado = await salvarCliente(clienteId ?? null, dados);
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <Field label="Nome" htmlFor="nome" error={errors.nome?.message}>
        <input id="nome" className={controlClass} disabled={somenteLeitura} {...register("nome")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="CPF/CNPJ" htmlFor="documento" error={errors.documento?.message}>
          <input id="documento" className={controlClass} disabled={somenteLeitura} {...register("documento")} />
        </Field>
        <Field label="Tipo" htmlFor="tipo" error={errors.tipo?.message}>
          <select id="tipo" className={controlClass} disabled={somenteLeitura} {...register("tipo")}>
            {tiposCliente.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
        </Field>
        <Field label="Telefone" htmlFor="telefone" error={errors.telefone?.message}>
          <input id="telefone" className={controlClass} disabled={somenteLeitura} {...register("telefone")} />
        </Field>
        <Field label="WhatsApp" htmlFor="whatsapp" error={errors.whatsapp?.message}>
          <input id="whatsapp" className={controlClass} disabled={somenteLeitura} {...register("whatsapp")} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" className={controlClass} disabled={somenteLeitura} {...register("email")} />
        </Field>
      </div>
      <CamposEndereco register={register} errors={errors} setValue={setValue} />
      <Field label="Observações" htmlFor="observacoes" error={errors.observacoes?.message}>
        <textarea id="observacoes" rows={4} className={`${controlClass} h-auto py-2`} disabled={somenteLeitura} {...register("observacoes")} />
      </Field>
      {erroServidor ? <p className="text-sm text-danger" role="alert">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          {clienteId ? (
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!confirm("Excluir este cliente?")) return;
                const resultado = await excluirCliente(clienteId);
                if (resultado?.error) setErroServidor(resultado.error);
              }}
            >
              Excluir
            </Button>
          ) : null}
        </div>
      )}
    </form>
  );
}

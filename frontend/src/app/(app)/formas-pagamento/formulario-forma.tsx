"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { excluirForma, salvarForma } from "./actions";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  ativo: z.boolean(),
});

type ValoresFormulario = z.infer<typeof schema>;

export function FormularioForma({
  formaId,
  somenteLeitura,
  valoresIniciais,
}: {
  formaId?: string;
  somenteLeitura?: boolean;
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
    const resultado = await salvarForma(formaId ?? null, valores);
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <Field label="Nome" error={errors.nome?.message}>
        <input className="input input--primary w-full" disabled={somenteLeitura} {...register("nome")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={somenteLeitura}
          checked={watch("ativo")}
          onChange={(evento) => setValue("ativo", evento.target.checked, { shouldValidate: true })}
        />
        Ativa para propostas e contratos
      </label>
      {erroServidor ? <p className="text-sm text-danger" role="alert">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : "Salvar"}
          </Button>
          {formaId ? (
            <Confirmar
              rotulo="Excluir"
              titulo="Excluir forma de pagamento?"
              confirmar="Excluir"
              aoConfirmar={async () => {
                const resultado = await excluirForma(formaId);
                if (resultado?.error) setErroServidor(resultado.error);
              }}
            />
          ) : null}
        </div>
      )}
    </form>
  );
}

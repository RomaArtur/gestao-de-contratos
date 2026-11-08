"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, Label, TextArea, TextField } from "@heroui/react";
import { controlClass, Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { CampoLista } from "@/components/ui/campo-lista";
import { Confirmar } from "@/components/ui/confirmar";
import { Indicador } from "@/components/ui/indicador";
import { deCampoDataHora } from "@/lib/calendario";
import { tiposEvento } from "@/lib/labels";
import { cancelarEvento, salvarEvento } from "./actions";

const schema = z
  .object({
    titulo: z.string().min(3, "Informe o título."),
    tipo: z.enum(["VISITA", "REUNIAO", "ASSINATURA", "VENCIMENTO", "COMPROMISSO"]),
    inicio: z.string().min(16, "Informe o início."),
    fim: z.string().min(16, "Informe o fim."),
    descricao: z.string().optional(),
    imovelId: z.string().optional(),
    clienteId: z.string().optional(),
    contratoId: z.string().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.inicio && valor.fim && valor.fim <= valor.inicio) {
      ctx.addIssue({ code: "custom", path: ["fim"], message: "O fim precisa ser posterior ao início." });
    }
  });

type ValoresFormulario = z.infer<typeof schema>;
type Opcao = { id: string; rotulo: string };

export function FormularioEvento({
  eventoId,
  somenteLeitura,
  podeCancelar,
  imoveis,
  clientes,
  contratos,
  valoresIniciais,
}: {
  eventoId?: string;
  somenteLeitura?: boolean;
  podeCancelar?: boolean;
  imoveis: Opcao[];
  clientes: Opcao[];
  contratos: Opcao[];
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
    const resultado = await salvarEvento(eventoId ?? null, {
      titulo: valores.titulo,
      tipo: valores.tipo,
      inicio: deCampoDataHora(valores.inicio),
      fim: deCampoDataHora(valores.fim),
      descricao: valores.descricao,
      imovelId: valores.imovelId || undefined,
      clienteId: valores.clienteId || undefined,
      contratoId: valores.contratoId || undefined,
    });
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <Field label="Título" error={errors.titulo?.message}>
        <input className={controlClass} disabled={somenteLeitura} {...register("titulo")} />
      </Field>
      <Field label="Tipo" error={errors.tipo?.message}>
        <select className={controlClass} disabled={somenteLeitura} {...register("tipo")}>
          {tiposEvento.map(([valor, rotulo]) => (
            <option key={valor} value={valor}>{rotulo}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Início" error={errors.inicio?.message}>
          <input type="datetime-local" className={controlClass} disabled={somenteLeitura} {...register("inicio")} />
        </Field>
        <Field label="Fim" error={errors.fim?.message}>
          <input type="datetime-local" className={controlClass} disabled={somenteLeitura} {...register("fim")} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <CampoLista
          rotulo="Imóvel"
          itens={imoveis}
          valor={watch("imovelId")}
          erro={errors.imovelId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("imovelId", valor, { shouldValidate: true })}
        />
        <CampoLista
          rotulo="Cliente"
          itens={clientes}
          valor={watch("clienteId")}
          erro={errors.clienteId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("clienteId", valor, { shouldValidate: true })}
        />
        <CampoLista
          rotulo="Contrato"
          itens={contratos}
          valor={watch("contratoId")}
          erro={errors.contratoId?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("contratoId", valor, { shouldValidate: true })}
        />
      </div>
      <TextField fullWidth isInvalid={Boolean(errors.descricao)}>
        <Label>Descrição</Label>
        <TextArea disabled={somenteLeitura} rows={4} {...register("descricao")} />
        {errors.descricao ? <FieldError>{errors.descricao.message}</FieldError> : null}
      </TextField>
      {erroServidor ? <p className="text-sm text-danger" role="alert">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : "Salvar"}
          </Button>
          {podeCancelar && eventoId ? (
            <Confirmar
              rotulo="Cancelar evento"
              titulo="Cancelar este evento?"
              confirmar="Cancelar evento"
              aoConfirmar={async () => {
                const resultado = await cancelarEvento(eventoId);
                if (resultado?.error) setErroServidor(resultado.error);
              }}
            />
          ) : null}
        </div>
      )}
    </form>
  );
}

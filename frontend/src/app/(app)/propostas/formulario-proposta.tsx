"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, CheckboxGroup, FieldError, Label, TextArea, TextField } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { CampoData } from "@/components/ui/campo-data";
import { CampoLista } from "@/components/ui/campo-lista";
import { CampoNumero } from "@/components/ui/campo-numero";
import { Indicador } from "@/components/ui/indicador";
import { salvarProposta, type DadosProposta } from "./actions";

const schema = z.object({
  imovelId: z.string().uuid("Selecione o imóvel."),
  clienteId: z.string().uuid("Selecione o cliente."),
  finalidade: z.enum(["VENDA", "ALUGUEL"]),
  valor: z.coerce.number().positive("Informe o valor."),
  condicoes: z.string().optional(),
  validade: z.string().optional(),
});

type ValoresFormulario = z.infer<typeof schema>;

export type Opcao = { id: string; rotulo: string };

export function FormularioProposta({
  propostaId,
  somenteLeitura,
  imoveis,
  clientes,
  valoresIniciais,
}: {
  propostaId?: string;
  somenteLeitura?: boolean;
  imoveis: Opcao[];
  clientes: Opcao[];
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
    const dados: DadosProposta = {
      imovelId: valores.imovelId,
      clienteId: valores.clienteId,
      finalidade: valores.finalidade,
      valor: Number(valores.valor),
      condicoes: valores.condicoes,
      validade: valores.validade || undefined,
    };
    const resultado = await salvarProposta(propostaId ?? null, dados);
    if (resultado?.error) setErroServidor(resultado.error);
  }

  return (
    <form className="flex max-w-3xl flex-col gap-4" onSubmit={handleSubmit(aoEnviar)}>
      <div className="grid gap-4 md:grid-cols-2">
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
        <CheckboxGroup
          isDisabled={somenteLeitura}
          value={[watch("finalidade")]}
          onChange={(valor) => {
            const proximo = valor.at(-1);
            if (proximo === "VENDA" || proximo === "ALUGUEL") {
              setValue("finalidade", proximo, { shouldValidate: true });
            }
          }}
        >
          <Label>Finalidade</Label>
          <div className="flex gap-4">
            <Checkbox value="VENDA">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Venda</Checkbox.Content>
            </Checkbox>
            <Checkbox value="ALUGUEL">
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Aluguel</Checkbox.Content>
            </Checkbox>
          </div>
          {errors.finalidade ? <FieldError>{errors.finalidade.message}</FieldError> : null}
        </CheckboxGroup>
        <CampoNumero
          rotulo="Valor"
          moeda
          valor={watch("valor")}
          erro={errors.valor?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("valor", valor, { shouldValidate: true })}
        />
        <CampoData
          rotulo="Validade"
          valor={watch("validade")}
          erro={errors.validade?.message}
          desabilitado={somenteLeitura}
          aoMudar={(valor) => setValue("validade", valor, { shouldValidate: true })}
        />
      </div>
      <TextField fullWidth isInvalid={Boolean(errors.condicoes)}>
        <Label>Condições</Label>
        <TextArea disabled={somenteLeitura} rows={4} {...register("condicoes")} />
        {errors.condicoes ? <FieldError>{errors.condicoes.message}</FieldError> : null}
      </TextField>
      {erroServidor ? <p className="text-sm text-danger">{erroServidor}</p> : null}
      {somenteLeitura ? null : (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Indicador rotulo="Salvando" indeterminado /> : propostaId ? "Salvar" : "Criar"}
        </Button>
      )}
    </form>
  );
}

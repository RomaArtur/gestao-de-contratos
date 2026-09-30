"use client";

import type { FocusEvent } from "react";
import type { FieldErrors, Path, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { controlClass, Field } from "@/components/field";
import type { EnderecoFormulario } from "@/lib/endereco";
import { consultarCep } from "@/lib/viacep";

type FormularioComEndereco = { endereco: EnderecoFormulario };

export function CamposEndereco<T extends FormularioComEndereco>({
  register,
  errors,
  setValue,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  setValue: UseFormSetValue<T>;
}) {
  const erros = errors.endereco as FieldErrors<EnderecoFormulario> | undefined;
  const cep = register("endereco.cep" as Path<T>);

  async function preencherCep(event: FocusEvent<HTMLInputElement>) {
    const endereco = await consultarCep(event.target.value);
    if (!endereco) return;
    setValue("endereco.logradouro" as Path<T>, endereco.logradouro as never);
    setValue("endereco.bairro" as Path<T>, endereco.bairro as never);
    setValue("endereco.cidade" as Path<T>, endereco.cidade as never);
    setValue("endereco.uf" as Path<T>, endereco.uf as never);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="CEP" htmlFor="cep" error={erros?.cep?.message}>
        <input
          id="cep"
          className={controlClass}
          {...cep}
          onBlur={(event) => {
            void cep.onBlur(event);
            void preencherCep(event);
          }}
        />
      </Field>
      <Field label="Número" htmlFor="numero" error={erros?.numero?.message}>
        <input id="numero" className={controlClass} {...register("endereco.numero" as Path<T>)} />
      </Field>
      <Field label="Logradouro" htmlFor="logradouro" error={erros?.logradouro?.message}>
        <input id="logradouro" className={controlClass} {...register("endereco.logradouro" as Path<T>)} />
      </Field>
      <Field label="Complemento" htmlFor="complemento" error={erros?.complemento?.message}>
        <input id="complemento" className={controlClass} {...register("endereco.complemento" as Path<T>)} />
      </Field>
      <Field label="Bairro" htmlFor="bairro" error={erros?.bairro?.message}>
        <input id="bairro" className={controlClass} {...register("endereco.bairro" as Path<T>)} />
      </Field>
      <Field label="Cidade" htmlFor="cidade" error={erros?.cidade?.message}>
        <input id="cidade" className={controlClass} {...register("endereco.cidade" as Path<T>)} />
      </Field>
      <Field label="UF" htmlFor="uf" error={erros?.uf?.message}>
        <input id="uf" maxLength={2} className={controlClass} {...register("endereco.uf" as Path<T>)} />
      </Field>
    </div>
  );
}

"use client";

import { FieldError, Label, NumberField } from "@heroui/react";

export function CampoNumero({
  rotulo,
  valor,
  erro,
  desabilitado,
  moeda = false,
  aoMudar,
}: {
  rotulo: string;
  valor?: number | null;
  erro?: string;
  desabilitado?: boolean;
  moeda?: boolean;
  aoMudar: (valor: number) => void;
}) {
  return (
    <NumberField
      className="w-full"
      fullWidth
      formatOptions={moeda ? { style: "currency", currency: "BRL" } : { maximumFractionDigits: 2 }}
      isDisabled={desabilitado}
      isInvalid={Boolean(erro)}
      minValue={0}
      value={valor ?? undefined}
      onChange={aoMudar}
    >
      <Label>{rotulo}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {erro ? <FieldError>{erro}</FieldError> : null}
    </NumberField>
  );
}

"use client";

import { DateField, DatePicker, FieldError, Label } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Calendario } from "@/components/ui/calendario";

export function CampoData({
  rotulo,
  valor,
  erro,
  desabilitado,
  aoMudar,
}: {
  rotulo: string;
  valor?: string;
  erro?: string;
  desabilitado?: boolean;
  aoMudar: (valor: string) => void;
}) {
  const data = valor && valor.length >= 10 ? parseDate(valor.slice(0, 10)) : null;

  return (
    <DatePicker
      className="w-full"
      granularity="day"
      isDisabled={desabilitado}
      isInvalid={Boolean(erro)}
      value={data}
      onChange={(proxima) => aoMudar(proxima ? proxima.toString() : "")}
    >
      <Label>{rotulo}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segmento) => <DateField.Segment segment={segmento} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendario rotulo={rotulo} />
      </DatePicker.Popover>
      {erro ? <FieldError>{erro}</FieldError> : null}
    </DatePicker>
  );
}

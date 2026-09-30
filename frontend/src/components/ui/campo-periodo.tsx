"use client";

import { DateField, DateRangePicker, FieldError, Label, RangeCalendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";

function dataDe(valor?: string) {
  return valor && valor.length >= 10 ? parseDate(valor.slice(0, 10)) : null;
}

export function CampoPeriodo({
  inicio,
  fim,
  erro,
  desabilitado,
  aoMudar,
}: {
  inicio?: string;
  fim?: string;
  erro?: string;
  desabilitado?: boolean;
  aoMudar: (inicio: string, fim: string) => void;
}) {
  const comeco = dataDe(inicio);
  const termino = dataDe(fim);
  const valor = comeco && termino ? { start: comeco, end: termino } : null;

  return (
    <DateRangePicker
      className="w-full"
      granularity="day"
      isDisabled={desabilitado}
      isInvalid={Boolean(erro)}
      value={valor}
      onChange={(periodo) => {
        aoMudar(periodo?.start ? periodo.start.toString() : "", periodo?.end ? periodo.end.toString() : "");
      }}
    >
      <Label>Período</Label>
      <DateField.Group fullWidth>
        <DateField.Input slot="start">{(segmento) => <DateField.Segment segment={segmento} />}</DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">{(segmento) => <DateField.Segment segment={segmento} />}</DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger>
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label="Período">
          <RangeCalendar.Header>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(dia) => <RangeCalendar.HeaderCell>{dia}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>{(data) => <RangeCalendar.Cell date={data} />}</RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
      {erro ? <FieldError>{erro}</FieldError> : null}
    </DateRangePicker>
  );
}

import { Calendar } from "@heroui/react";

export function Calendario({ rotulo }: { rotulo: string }) {
  return (
    <Calendar aria-label={rotulo}>
      <Calendar.Header>
        <Calendar.YearPickerTrigger>
          <Calendar.YearPickerTriggerHeading />
          <Calendar.YearPickerTriggerIndicator />
        </Calendar.YearPickerTrigger>
        <Calendar.NavButton slot="previous" />
        <Calendar.NavButton slot="next" />
      </Calendar.Header>
      <Calendar.Grid>
        <Calendar.GridHeader>{(dia) => <Calendar.HeaderCell>{dia}</Calendar.HeaderCell>}</Calendar.GridHeader>
        <Calendar.GridBody>{(data) => <Calendar.Cell date={data} />}</Calendar.GridBody>
      </Calendar.Grid>
      <Calendar.YearPickerGrid>
        <Calendar.YearPickerGridBody>
          {({ year }) => <Calendar.YearPickerCell year={year} />}
        </Calendar.YearPickerGridBody>
      </Calendar.YearPickerGrid>
    </Calendar>
  );
}

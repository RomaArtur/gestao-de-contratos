"use client";

import { ProgressCircle } from "@heroui/react";

export function Indicador({
  rotulo,
  valor = 0,
  indeterminado = false,
}: {
  rotulo: string;
  valor?: number;
  indeterminado?: boolean;
}) {
  return (
    <ProgressCircle aria-label={rotulo} isIndeterminate={indeterminado} size="sm" value={valor}>
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

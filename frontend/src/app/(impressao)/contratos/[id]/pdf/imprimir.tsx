"use client";

import { Button } from "@/components/ui/button";

export function ImprimirContrato({ codigo }: { codigo: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Salvar {codigo} como PDF
    </Button>
  );
}
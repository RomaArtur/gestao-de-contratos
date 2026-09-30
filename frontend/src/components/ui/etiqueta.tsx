import { Chip } from "@heroui/react";

const cores: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = {
  DISPONIVEL: "success",
  ACEITA: "success",
  VIGENTE: "success",
  EM_NEGOCIACAO: "warning",
  ENVIADA: "warning",
  MINUTA: "warning",
  RESERVADO: "accent",
  RASCUNHO: "accent",
  ALUGADO: "accent",
  VENDA: "accent",
  ALUGUEL: "default",
  VENDA_ALUGUEL: "accent",
  VENDIDO: "default",
  RECUSADA: "danger",
  CANCELADA: "danger",
  CANCELADO: "danger",
  INATIVO: "danger",
  ENCERRADO: "default",
};

export function Etiqueta({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <Chip color={cores[valor] ?? "default"} size="sm" variant="soft">
      {rotulo}
    </Chip>
  );
}

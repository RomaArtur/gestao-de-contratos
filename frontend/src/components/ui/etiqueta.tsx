import { Chip } from "@heroui/react";
import {
  BadgeCheck,
  Ban,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CircleCheck,
  CircleOff,
  CircleX,
  FileText,
  Handshake,
  House,
  KeyRound,
  LandPlot,
  MoreHorizontal,
  Pencil,
  Send,
  Star,
  Store,
  Tag,
  Tags,
  Trees,
  TrendingUp,
  User,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const cores: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = {
  DISPONIVEL: "success",
  ACEITA: "success",
  VIGENTE: "success",
  AGENDADO: "success",
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

const icones: Record<string, LucideIcon> = {
  DISPONIVEL: CircleCheck,
  EM_NEGOCIACAO: Handshake,
  RESERVADO: Bookmark,
  ALUGADO: KeyRound,
  VENDIDO: BadgeCheck,
  INATIVO: CircleOff,
  VENDA: Tag,
  ALUGUEL: House,
  VENDA_ALUGUEL: Tags,
  FISICA: User,
  JURIDICA: Building2,
  CASA: House,
  APARTAMENTO: Building2,
  SALA_COMERCIAL: Briefcase,
  LOJA: Store,
  GALPAO: Warehouse,
  TERRENO: LandPlot,
  CHACARA: Trees,
  OUTROS: MoreHorizontal,
  COMPRADOR: User,
  LOCATARIO: KeyRound,
  INVESTIDOR: TrendingUp,
  EMPRESA: Building2,
  RASCUNHO: Pencil,
  ENVIADA: Send,
  ACEITA: CircleCheck,
  RECUSADA: CircleX,
  CANCELADA: Ban,
  MINUTA: FileText,
  VIGENTE: BadgeCheck,
  ENCERRADO: CircleOff,
  CANCELADO: Ban,
  AGENDADO: Calendar,
};

export function Etiqueta({ valor, rotulo }: { valor: string; rotulo: string }) {
  const Icone = rotulo === "Principal" ? Star : icones[valor];
  return (
    <Chip color={cores[valor] ?? "default"} size="sm" variant="soft">
      <span className="inline-flex items-center gap-1">
        {Icone ? <Icone className="size-3 shrink-0" aria-hidden /> : null}
        {rotulo}
      </span>
    </Chip>
  );
}

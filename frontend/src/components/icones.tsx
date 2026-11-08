import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  CalendarX2,
  FileSignature,
  FileText,
  FileWarning,
  KeyRound,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

export const icones = {
  painel: LayoutDashboard,
  agenda: Calendar,
  proprietarios: KeyRound,
  imoveis: Building2,
  clientes: Users,
  propostas: FileText,
  contratos: FileSignature,
  pagamentos: Wallet,
  documentacao: BookOpen,
  documentos: FileWarning,
  ativos: BadgeCheck,
  vencidos: CalendarX2,
  proximos: CalendarClock,
} satisfies Record<string, LucideIcon>;

export function TituloPagina({ icone: Icone, children }: { icone: LucideIcon; children: ReactNode }) {
  return (
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Icone className="size-6 text-accent" aria-hidden />
      {children}
    </h1>
  );
}

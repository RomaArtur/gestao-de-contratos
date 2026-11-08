"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { icones } from "@/components/icones";

const items = [
  { href: "/", label: "Painel", icone: icones.painel },
  { href: "/agenda", label: "Agenda", icone: icones.agenda },
  { href: "/proprietarios", label: "Proprietários", icone: icones.proprietarios },
  { href: "/imoveis", label: "Imóveis", icone: icones.imoveis },
  { href: "/clientes", label: "Clientes", icone: icones.clientes },
  { href: "/propostas", label: "Propostas", icone: icones.propostas },
  { href: "/contratos", label: "Contratos", icone: icones.contratos },
  { href: "/formas-pagamento", label: "Formas de pagamento", icone: icones.pagamentos },
  { href: "/documentacao", label: "Documentação API", icone: icones.documentacao },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Módulos">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icone = item.icone;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                : "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-default"
            }
            aria-current={active ? "page" : undefined}
          >
            <Icone className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

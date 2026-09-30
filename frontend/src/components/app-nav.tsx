"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Painel" },
  { href: "/proprietarios", label: "Proprietários" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/clientes", label: "Clientes" },
  { href: "/propostas", label: "Propostas" },
  { href: "/contratos", label: "Contratos" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Módulos">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                : "rounded-xl px-3 py-2 text-sm text-foreground hover:bg-default"
            }
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

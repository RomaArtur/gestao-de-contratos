import type { LucideIcon } from "lucide-react";

export function GraficoBarras({
  titulo,
  itens,
  icone: Icone,
}: {
  titulo: string;
  itens: { rotulo: string; total: number }[];
  icone?: LucideIcon;
}) {
  const maximo = Math.max(1, ...itens.map((item) => item.total));

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        {Icone ? <Icone className="size-4 text-accent" aria-hidden /> : null}
        {titulo}
      </h2>
      <ul className="flex flex-col gap-3">
        {itens.map((item) => (
          <li key={item.rotulo} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm">
            <span>{item.rotulo}</span>
            <span className="h-2 overflow-hidden rounded-full bg-default">
              <span
                className="block h-2 rounded-full bg-accent"
                style={{ width: `${Math.round((item.total / maximo) * 100)}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{item.total}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

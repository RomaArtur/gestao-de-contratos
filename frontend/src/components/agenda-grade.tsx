import { Link } from "@heroui/react";
import { cruzaDia, horaDoInstante, hojeLocal, type VisaoAgenda } from "@/lib/calendario";
import { rotuloDe, tiposEvento } from "@/lib/labels";

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export type EventoGrade = {
  id: string;
  titulo: string;
  tipo: string;
  inicio: string;
  fim: string;
  situacao: string;
};

export function AgendaGrade({
  visao,
  data,
  dias,
  eventos,
}: {
  visao: VisaoAgenda;
  data: string;
  dias: string[];
  eventos: EventoGrade[];
}) {
  const hoje = hojeLocal();
  const mesAtual = data.slice(0, 7);

  return (
    <div className={`grid gap-2 ${visao === "dia" ? "grid-cols-1" : "grid-cols-7"}`}>
      {visao === "dia" ? null : diasSemana.map((dia) => (
        <p key={dia} className="px-2 text-xs font-medium text-muted">{dia}</p>
      ))}
      {dias.map((dia) => {
        const doMes = dia.slice(0, 7) === mesAtual;
        const itens = eventos.filter((evento) => cruzaDia(evento.inicio, evento.fim, dia));
        return (
          <section
            key={dia}
            className={`flex min-h-28 flex-col gap-1 rounded-xl border border-border p-2 ${
              dia === hoje ? "bg-accent/10" : ""
            } ${visao === "mes" && !doMes ? "opacity-50" : ""}`}
          >
            <Link href={`/agenda?visao=dia&data=${dia}`} className="text-xs font-medium">
              {Number(dia.slice(8))}
            </Link>
            {itens.map((evento) => (
              <Link
                key={evento.id}
                href={`/agenda/${evento.id}`}
                className={`truncate rounded-lg bg-default px-2 py-1 text-xs ${
                  evento.situacao === "CANCELADO" ? "text-muted line-through" : ""
                }`}
              >
                {horaDoInstante(evento.inicio)} {evento.titulo}
                <span className="text-muted"> · {rotuloDe(tiposEvento, evento.tipo)}</span>
              </Link>
            ))}
          </section>
        );
      })}
    </div>
  );
}

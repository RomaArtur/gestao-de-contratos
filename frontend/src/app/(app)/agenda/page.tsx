import { Link } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { auth } from "@/auth";
import { Plus } from "lucide-react";
import { AgendaGrade } from "@/components/agenda-grade";
import { icones, TituloPagina } from "@/components/icones";
import { api } from "@/lib/api";
import {
  deslocar,
  diasDaVisao,
  hojeLocal,
  intervaloConsulta,
  rotuloPeriodo,
  type VisaoAgenda,
} from "@/lib/calendario";
import { canWrite } from "@/lib/permissions";

type Evento = {
  id: string;
  titulo: string;
  tipo: string;
  inicio: string;
  fim: string;
  situacao: string;
};

const visoes: { id: VisaoAgenda; rotulo: string }[] = [
  { id: "dia", rotulo: "Dia" },
  { id: "semana", rotulo: "Semana" },
  { id: "mes", rotulo: "Mês" },
];

function visaoDe(valor?: string): VisaoAgenda {
  if (valor === "dia" || valor === "semana" || valor === "mes") return valor;
  return "mes";
}

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; data?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const visao = visaoDe(params.visao);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "") ? params.data! : hojeLocal();
  const intervalo = intervaloConsulta(visao, data);
  const consulta = new URLSearchParams({
    inicio: `${intervalo.inicio}T00:00:00.000-03:00`,
    fim: `${intervalo.fim}T00:00:00.000-03:00`,
  });
  const eventos = await api<Evento[]>(`/agenda?${consulta.toString()}`);
  const anterior = deslocar(visao, data, -1);
  const proximo = deslocar(visao, data, 1);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.agenda}>Agenda</TituloPagina>
        {canWrite(session?.user?.role) ? (
          <Link href={`/agenda/novo?data=${data}`} className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/agenda?visao=${visao}&data=${anterior}`} className={buttonVariants({ variant: "outline" })}>
            Anterior
          </Link>
          <Link href={`/agenda?visao=${visao}&data=${hojeLocal()}`} className={buttonVariants({ variant: "outline" })}>
            Hoje
          </Link>
          <Link href={`/agenda?visao=${visao}&data=${proximo}`} className={buttonVariants({ variant: "outline" })}>
            Próximo
          </Link>
          <p className="px-2 text-sm font-medium capitalize">{rotuloPeriodo(visao, data)}</p>
        </div>
        <div className="flex gap-2">
          {visoes.map((item) => (
            <Link
              key={item.id}
              href={`/agenda?visao=${item.id}&data=${data}`}
              className={buttonVariants({ variant: item.id === visao ? "primary" : "outline" })}
              aria-current={item.id === visao ? "page" : undefined}
            >
              {item.rotulo}
            </Link>
          ))}
        </div>
      </div>
      <AgendaGrade visao={visao} data={data} dias={diasDaVisao(visao, data)} eventos={eventos} />
    </main>
  );
}

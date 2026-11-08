import { auth } from "@/auth";
import { api, listarTudo } from "@/lib/api";
import { paraCampoDataHora } from "@/lib/calendario";
import { rotuloDe, situacoesEvento } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FormularioEvento } from "../formulario-evento";

type Evento = {
  id: string;
  titulo: string;
  tipo: "VISITA" | "REUNIAO" | "ASSINATURA" | "VENCIMENTO" | "COMPROMISSO";
  inicio: string;
  fim: string;
  descricao: string | null;
  situacao: string;
  imovelId: string | null;
  clienteId: string | null;
  contratoId: string | null;
};

type Cadastro = { id: string; codigo?: string; nome?: string; nomeProprietario?: string | null };

export default async function PaginaEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [evento, imoveis, clientes, contratos] = await Promise.all([
    api<Evento>(`/agenda/${id}`),
    listarTudo<Cadastro>("/imoveis"),
    listarTudo<Cadastro>("/clientes"),
    listarTudo<Cadastro>("/contratos"),
  ]);
  const podeEscrever = canWrite(session?.user?.role) && evento.situacao === "AGENDADO";

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{evento.titulo}</h1>
        <Etiqueta valor={evento.situacao} rotulo={rotuloDe(situacoesEvento, evento.situacao)} />
      </div>
      <FormularioEvento
        eventoId={evento.id}
        somenteLeitura={!podeEscrever}
        podeCancelar={podeEscrever}
        imoveis={imoveis.map((item) => ({
          id: item.id,
          rotulo: item.nomeProprietario ? `${item.codigo} — ${item.nomeProprietario}` : item.codigo ?? item.id,
        }))}
        clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
        contratos={contratos.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
        valoresIniciais={{
          titulo: evento.titulo,
          tipo: evento.tipo,
          inicio: paraCampoDataHora(evento.inicio),
          fim: paraCampoDataHora(evento.fim),
          descricao: evento.descricao ?? "",
          imovelId: evento.imovelId ?? "",
          clienteId: evento.clienteId ?? "",
          contratoId: evento.contratoId ?? "",
        }}
      />
    </main>
  );
}

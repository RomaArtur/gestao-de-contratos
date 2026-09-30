import { auth } from "@/auth";
import { api } from "@/lib/api";
import { rotuloDe, situacoesProposta } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { AcoesProposta } from "../acoes-proposta";
import { FormularioProposta } from "../formulario-proposta";

type Proposta = {
  id: string;
  imovelId: string;
  codigoImovel: string | null;
  clienteId: string;
  nomeCliente: string | null;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  validade: string | null;
  situacao: string;
  condicoes: string | null;
  motivo: string | null;
  corretor: string | null;
  historico: {
    id: string;
    situacaoAnterior: string | null;
    situacaoNova: string;
    observacao: string | null;
    criadoEm: string;
    usuario: string | null;
  }[];
};

type Lista = { dados: { id: string; codigo?: string; nome?: string }[] };

export default async function PaginaProposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [proposta, imoveis, clientes] = await Promise.all([
    api<Proposta>(`/propostas/${id}`),
    api<Lista>("/imoveis?tamanhoPagina=100"),
    api<Lista>("/clientes?tamanhoPagina=100"),
  ]);
  const podeEscrever = canWrite(session?.user?.role);
  const editavel = podeEscrever && proposta.situacao === "RASCUNHO";

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{proposta.codigoImovel}</h1>
        <Etiqueta valor={proposta.situacao} rotulo={rotuloDe(situacoesProposta, proposta.situacao)} />
      </div>
      <Abas
        itens={[
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
              <div className="flex flex-col gap-6">
                <FormularioProposta
                  propostaId={proposta.id}
                  somenteLeitura={!editavel}
                  imoveis={imoveis.dados.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
                  clientes={clientes.dados.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
                  valoresIniciais={{
                    imovelId: proposta.imovelId,
                    clienteId: proposta.clienteId,
                    finalidade: proposta.finalidade,
                    valor: proposta.valor,
                    condicoes: proposta.condicoes ?? "",
                    validade: proposta.validade ?? "",
                  }}
                />
                {podeEscrever ? <AcoesProposta id={proposta.id} situacao={proposta.situacao} /> : null}
              </div>
            ),
          },
          {
            id: "historico",
            titulo: "Histórico",
            conteudo: (
              <ul className="flex max-w-3xl flex-col gap-2 text-sm">
                {proposta.historico.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <Etiqueta valor={item.situacaoNova} rotulo={rotuloDe(situacoesProposta, item.situacaoNova)} />
                    <span>{item.observacao}</span>
                    <span className="text-muted">{new Date(item.criadoEm).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </main>
  );
}

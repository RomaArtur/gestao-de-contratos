import { auth } from "@/auth";
import { api, listarTudo } from "@/lib/api";
import { rotuloDe, situacoesProposta } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { EditorContrato } from "../../contratos/editor-contrato";
import { AcoesProposta } from "../acoes-proposta";
import { FormularioProposta } from "../formulario-proposta";
import { GerarContrato } from "../gerar-contrato";

type Proposta = {
  id: string;
  imovelId: string;
  codigoImovel: string | null;
  clienteId: string;
  nomeCliente: string | null;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  validade: string | null;
  entrada: number | null;
  parcelas: number | null;
  formaPagamentoId: string | null;
  contratoId: string | null;
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

type Cadastro = { id: string; codigo?: string; nome?: string };
type Forma = { id: string; nome: string; ativo: boolean };

export default async function PaginaProposta({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { id } = await params;
  const { aba } = await searchParams;
  const session = await auth();
  const [proposta, imoveis, clientes, formas] = await Promise.all([
    api<Proposta>(`/propostas/${id}`),
    listarTudo<Cadastro>("/imoveis"),
    listarTudo<Cadastro>("/clientes"),
    api<Forma[]>("/formas-pagamento"),
  ]);
  const contrato = proposta.contratoId
    ? await api<{ id: string; codigo: string; conteudo: string | null; situacao: string }>(`/contratos/${proposta.contratoId}`)
    : null;
  const podeEscrever = canWrite(session?.user?.role);
  const editavel = podeEscrever && proposta.situacao === "RASCUNHO";

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{proposta.codigoImovel}</h1>
        <Etiqueta valor={proposta.situacao} rotulo={rotuloDe(situacoesProposta, proposta.situacao)} />
      </div>
      <Abas
        selecionada={aba === "contrato" ? "contrato" : aba === "historico" ? "historico" : "dados"}
        itens={[
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
              <div className="flex flex-col gap-6">
                <FormularioProposta
                  propostaId={proposta.id}
                  somenteLeitura={!editavel}
                  imoveis={imoveis.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
                  clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
                  formas={formas
                    .filter((forma) => forma.ativo || forma.id === proposta.formaPagamentoId)
                    .map((forma) => ({ id: forma.id, rotulo: forma.ativo ? forma.nome : `${forma.nome} (inativa)` }))}
                  valoresIniciais={{
                    imovelId: proposta.imovelId,
                    clienteId: proposta.clienteId,
                    finalidade: proposta.finalidade,
                    valor: proposta.valor,
                    condicoes: proposta.condicoes ?? "",
                    validade: proposta.validade ?? "",
                    formaPagamentoId: proposta.formaPagamentoId ?? "",
                    entrada: proposta.entrada,
                    parcelas: proposta.parcelas,
                  }}
                />
                {podeEscrever ? <AcoesProposta id={proposta.id} situacao={proposta.situacao} /> : null}
              </div>
            ),
          },
          {
            id: "contrato",
            titulo: "Contrato",
            conteudo:
              contrato?.conteudo ? (
                <EditorContrato
                  id={contrato.id}
                  codigo={contrato.codigo}
                  conteudoInicial={contrato.conteudo}
                  situacao={contrato.situacao}
                  podeEscrever={podeEscrever}
                />
              ) : podeEscrever && proposta.situacao === "ACEITA" ? (
                <GerarContrato id={proposta.id} />
              ) : (
                <p className="text-sm text-muted">
                  {proposta.situacao === "RASCUNHO" || proposta.situacao === "ENVIADA"
                    ? "Aceite a proposta para gerar o contrato."
                    : "Esta proposta ainda não tem contrato gerado."}
                </p>
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

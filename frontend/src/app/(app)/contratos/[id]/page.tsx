import { auth } from "@/auth";
import { api, listarTudo } from "@/lib/api";
import { dinheiro, finalidades, rotuloDe, situacoesContrato } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Link } from "@heroui/react";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { AcoesContrato } from "../acoes-contrato";
import { DocumentosContrato } from "../documentos-contrato";
import { EditorContrato } from "../editor-contrato";
import { FormularioContrato } from "../formulario-contrato";

type Contrato = {
  id: string;
  codigo: string;
  propostaId: string | null;
  imovelId: string;
  codigoImovel: string | null;
  proprietarioId: string | null;
  nomeProprietario: string | null;
  clienteId: string;
  nomeCliente: string | null;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  formaPagamentoId: string | null;
  formaPagamento: string | null;
  dataInicio: string;
  vencimento: string;
  situacao: string;
  contatoId: string;
  conteudo: string | null;
  observacoes: string | null;
  motivo: string | null;
  corretor: string | null;
  documentos: { id: string; url: string; nomeOriginal: string; categoria: string }[];
  historico: {
    id: string;
    situacaoAnterior: string | null;
    situacaoNova: string;
    observacao: string | null;
    criadoEm: string;
    usuario: string | null;
  }[];
};

export default async function PaginaContrato({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; email?: string; destino?: string }>;
}) {
  const { id } = await params;
  const { aba, email, destino } = await searchParams;
  const avisoEmail =
    email === "enviado"
      ? `Contrato enviado para ${destino}.`
      : email === "falhou"
        ? "Contrato finalizado, mas o e-mail não foi enviado."
        : email === "sem"
          ? "Contrato finalizado. O contato não tem e-mail cadastrado."
          : null;
  const session = await auth();
  const contrato = await api<Contrato>(`/contratos/${id}`);
  const podeEscrever = canWrite(session?.user?.role);
  const editavel = podeEscrever && contrato.situacao === "MINUTA";
  const documentosAbertos = podeEscrever && (contrato.situacao === "MINUTA" || contrato.situacao === "VIGENTE");
  const [imoveis, clientes, formas] = await Promise.all([
    listarTudo<{ id: string; codigo?: string; nomeProprietario?: string | null }>("/imoveis"),
    listarTudo<{ id: string; nome?: string }>("/clientes"),
    api<{ id: string; nome: string; ativo: boolean }[]>("/formas-pagamento"),
  ]);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{contrato.codigo}</h1>
        <Etiqueta valor={contrato.situacao} rotulo={rotuloDe(situacoesContrato, contrato.situacao)} />
        <span className="text-sm">{dinheiro(contrato.valor)}</span>
        <span className="text-sm text-muted">{contrato.formaPagamento ?? "Sem forma de pagamento"}</span>
      </div>
      <dl className="grid max-w-3xl gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-muted">Imóvel</dt>
          <dd><Link href={`/imoveis/${contrato.imovelId}`}>{contrato.codigoImovel}</Link></dd>
        </div>
        <div>
          <dt className="text-muted">Proprietário</dt>
          <dd>
            {contrato.proprietarioId ? (
              <Link href={`/proprietarios/${contrato.proprietarioId}`}>{contrato.nomeProprietario}</Link>
            ) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Cliente</dt>
          <dd><Link href={`/clientes/${contrato.clienteId}`}>{contrato.nomeCliente}</Link></dd>
        </div>
        <div>
          <dt className="text-muted">ID do contato</dt>
          <dd>{contrato.contatoId}</dd>
        </div>
        <div>
          <dt className="text-muted">Vigência</dt>
          <dd>{contrato.dataInicio}</dd>
        </div>
        <div>
          <dt className="text-muted">Vencimento</dt>
          <dd>{contrato.vencimento}</dd>
        </div>
        <div>
          <dt className="text-muted">Finalidade</dt>
          <dd>{rotuloDe(finalidades, contrato.finalidade)}</dd>
        </div>
      </dl>
      <Abas
        selecionada={aba === "documento" || aba === "documentos" || aba === "historico" ? aba : "dados"}
        itens={[
          ...(contrato.conteudo
            ? [
                {
                  id: "documento",
                  titulo: "Documento",
                  conteudo: (
                    <EditorContrato
                      id={contrato.id}
                      codigo={contrato.codigo}
                      conteudoInicial={contrato.conteudo}
                      situacao={contrato.situacao}
                      podeEscrever={podeEscrever}
                      avisoEmail={avisoEmail}
                    />
                  ),
                },
              ]
            : []),
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
              <div className="flex flex-col gap-6">
                <FormularioContrato
                  contratoId={contrato.id}
                  somenteLeitura={!editavel}
                  vinculadoAProposta={Boolean(contrato.propostaId)}
                  imoveis={imoveis.map((item) => ({
                    id: item.id,
                    rotulo: item.nomeProprietario ? `${item.codigo} — ${item.nomeProprietario}` : item.codigo ?? item.id,
                  }))}
                  clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
                  formas={formas
                    .filter((forma) => forma.ativo || forma.id === contrato.formaPagamentoId)
                    .map((forma) => ({ id: forma.id, rotulo: forma.ativo ? forma.nome : `${forma.nome} (inativa)` }))}
                  valoresIniciais={{
                    imovelId: contrato.imovelId,
                    clienteId: contrato.clienteId,
                    finalidade: contrato.finalidade,
                    valor: contrato.valor,
                    formaPagamentoId: contrato.formaPagamentoId ?? "",
                    dataInicio: contrato.dataInicio,
                    vencimento: contrato.vencimento,
                    observacoes: contrato.observacoes ?? "",
                  }}
                />
                {podeEscrever ? <AcoesContrato id={contrato.id} situacao={contrato.situacao} /> : null}
              </div>
            ),
          },
          {
            id: "documentos",
            titulo: "Documentos",
            conteudo: (
              <DocumentosContrato
                contratoId={contrato.id}
                somenteLeitura={!documentosAbertos}
                documentos={contrato.documentos}
              />
            ),
          },
          {
            id: "historico",
            titulo: "Histórico",
            conteudo: (
              <ul className="flex max-w-3xl flex-col gap-2 text-sm">
                {contrato.historico.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <Etiqueta valor={item.situacaoNova} rotulo={rotuloDe(situacoesContrato, item.situacaoNova)} />
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

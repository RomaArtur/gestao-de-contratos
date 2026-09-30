import { auth } from "@/auth";
import { api } from "@/lib/api";
import { dinheiro, rotuloDe, situacoesContrato } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { AcoesContrato } from "../acoes-contrato";
import { DocumentosContrato } from "../documentos-contrato";
import { FormularioContrato } from "../formulario-contrato";

type Contrato = {
  id: string;
  codigo: string;
  codigoImovel: string | null;
  nomeCliente: string | null;
  finalidade: string;
  valor: number;
  dataInicio: string;
  vencimento: string;
  situacao: string;
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

export default async function PaginaContrato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const contrato = await api<Contrato>(`/contratos/${id}`);
  const podeEscrever = canWrite(session?.user?.role);
  const editavel = podeEscrever && contrato.situacao === "MINUTA";
  const documentosAbertos = podeEscrever && (contrato.situacao === "MINUTA" || contrato.situacao === "VIGENTE");

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{contrato.codigo}</h1>
        <Etiqueta valor={contrato.situacao} rotulo={rotuloDe(situacoesContrato, contrato.situacao)} />
        <span className="text-sm">{dinheiro(contrato.valor)}</span>
      </div>
      <Abas
        itens={[
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
              <div className="flex flex-col gap-6">
                <FormularioContrato
                  contratoId={contrato.id}
                  somenteLeitura={!editavel}
                  valoresIniciais={{
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

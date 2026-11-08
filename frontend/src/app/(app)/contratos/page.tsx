import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { dinheiro, recortesContrato, rotuloDe, situacoesContrato } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { icones, TituloPagina } from "@/components/icones";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltroMenu } from "@/components/ui/filtro-menu";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";
import { AcoesListaContrato } from "./acoes-lista";

type ListaContratos = {
  dados: {
    id: string;
    codigo: string;
    codigoImovel: string | null;
    nomeCliente: string | null;
    valor: number;
    formaPagamento: string | null;
    nomeProprietario: string | null;
    situacao: string;
    contatoId: string;
    temDocumento: boolean;
    clienteTemEmail: boolean;
    dataInicio: string;
    vencimento: string;
  }[];
  total: number;
};

export default async function PaginaContratos({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; situacao?: string; pagina?: string; recorte?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const recorte = recortesContrato.find(([valor]) => valor === params.recorte)?.[1];
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  if (params.busca) consulta.set("busca", params.busca);
  if (recorte) consulta.set("recorte", params.recorte!);
  else if (params.situacao) consulta.set("situacao", params.situacao);
  const resultado = await api<ListaContratos>(`/contratos?${consulta.toString()}`);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.contratos}>Contratos</TituloPagina>
        {canWrite(session?.user?.role) ? (
          <Link href="/contratos/novo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca
          acao="/contratos"
          valor={params.busca}
          placeholder="Código, imóvel ou cliente"
          extras={params.recorte ? { recorte: params.recorte } : { situacao: params.situacao }}
        />
        {params.recorte ? null : <FiltroMenu nome="situacao" rotulo="Situação" opcoes={situacoesContrato} />}
      </div>
      {recorte ? (
        <p className="text-sm text-muted">
          Mostrando {recorte.toLowerCase()}. <Link href="/contratos">Ver todos</Link>
        </p>
      ) : null}
      <Tabela
        rotulo="Contratos"
        colunas={["Código", "Imóvel", "Proprietário", "Cliente", "ID do contato", "Valor", "Pagamento", "Situação", "Vigência", "Vencimento", "Ações"]}
        linhas={resultado.dados.map((contrato) => ({
          id: contrato.id,
          celulas: [
            <Link key="codigo" href={`/contratos/${contrato.id}`}>
              {contrato.codigo}
            </Link>,
            contrato.codigoImovel,
            contrato.nomeProprietario,
            contrato.nomeCliente,
            <span key="contato" className="text-xs">{contrato.contatoId}</span>,
            dinheiro(contrato.valor),
            contrato.formaPagamento ?? "—",
            <Etiqueta key="situacao" valor={contrato.situacao} rotulo={rotuloDe(situacoesContrato, contrato.situacao)} />,
            contrato.dataInicio,
            contrato.vencimento,
            <AcoesListaContrato
              key="acoes"
              id={contrato.id}
              codigo={contrato.codigo}
              situacao={contrato.situacao}
              temDocumento={contrato.temDocumento}
              clienteTemEmail={contrato.clienteTemEmail}
              podeEscrever={canWrite(session?.user?.role)}
            />,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

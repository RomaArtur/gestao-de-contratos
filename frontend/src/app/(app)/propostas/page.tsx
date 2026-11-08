import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { dinheiro, finalidades, rotuloDe, situacoesProposta } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { icones, TituloPagina } from "@/components/icones";
import { MenuAcoes } from "@/components/ui/menu-acoes";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltroMenu } from "@/components/ui/filtro-menu";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";

type ListaPropostas = {
  dados: {
    id: string;
    codigoImovel: string | null;
    nomeCliente: string | null;
    valor: number;
    situacao: string;
    validade: string | null;
    finalidade: string;
    formaPagamento: string | null;
  }[];
  total: number;
};

export default async function PaginaPropostas({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; situacao?: string; pagina?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  if (params.busca) consulta.set("busca", params.busca);
  if (params.situacao) consulta.set("situacao", params.situacao);
  const resultado = await api<ListaPropostas>(`/propostas?${consulta.toString()}`);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.propostas}>Propostas</TituloPagina>
        {canWrite(session?.user?.role) ? (
          <Link href="/propostas/nova" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca
          acao="/propostas"
          valor={params.busca}
          placeholder="Imóvel ou cliente"
          extras={{ situacao: params.situacao }}
        />
        <FiltroMenu nome="situacao" rotulo="Situação" opcoes={situacoesProposta} />
      </div>
      <Tabela
        rotulo="Propostas"
        colunas={["Imóvel", "Cliente", "Finalidade", "Valor", "Pagamento", "Situação", "Validade", "Ações"]}
        linhas={resultado.dados.map((proposta) => ({
          id: proposta.id,
          celulas: [
            <Link key="imovel" href={`/propostas/${proposta.id}`}>
              {proposta.codigoImovel}
            </Link>,
            proposta.nomeCliente,
            <Etiqueta key="finalidade" valor={proposta.finalidade} rotulo={rotuloDe(finalidades, proposta.finalidade)} />,
            dinheiro(proposta.valor),
            proposta.formaPagamento ?? "—",
            <Etiqueta key="situacao" valor={proposta.situacao} rotulo={rotuloDe(situacoesProposta, proposta.situacao)} />,
            proposta.validade ?? "—",
            <MenuAcoes key="acoes" rotulo={`Ações de ${proposta.codigoImovel ?? "proposta"}`} acoes={[{ id: "ver", rotulo: "Visualizar", href: `/propostas/${proposta.id}` }]} />,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

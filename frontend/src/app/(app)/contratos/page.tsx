import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { dinheiro, rotuloDe, situacoesContrato } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltroMenu } from "@/components/ui/filtro-menu";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";

type ListaContratos = {
  dados: {
    id: string;
    codigo: string;
    codigoImovel: string | null;
    nomeCliente: string | null;
    valor: number;
    situacao: string;
    vencimento: string;
  }[];
  total: number;
};

export default async function PaginaContratos({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; situacao?: string; pagina?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  if (params.busca) consulta.set("busca", params.busca);
  if (params.situacao) consulta.set("situacao", params.situacao);
  const resultado = await api<ListaContratos>(`/contratos?${consulta.toString()}`);

  return (
    <main className="flex flex-1 flex-col gap-4 px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
        {canWrite(session?.user?.role) ? (
          <Link href="/contratos/novo" className={buttonVariants({ variant: "primary" })}>
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca acao="/contratos" valor={params.busca} placeholder="Código, imóvel ou cliente" extras={{ situacao: params.situacao }} />
        <FiltroMenu nome="situacao" rotulo="Situação" opcoes={situacoesContrato} />
      </div>
      <Tabela
        rotulo="Contratos"
        colunas={["Código", "Imóvel", "Cliente", "Valor", "Situação", "Vencimento"]}
        linhas={resultado.dados.map((contrato) => ({
          id: contrato.id,
          celulas: [
            <Link key="codigo" href={`/contratos/${contrato.id}`}>
              {contrato.codigo}
            </Link>,
            contrato.codigoImovel,
            contrato.nomeCliente,
            dinheiro(contrato.valor),
            <Etiqueta key="situacao" valor={contrato.situacao} rotulo={rotuloDe(situacoesContrato, contrato.situacao)} />,
            contrato.vencimento,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

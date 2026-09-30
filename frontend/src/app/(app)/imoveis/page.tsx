import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { dinheiro, finalidades, rotuloDe, situacoes, tiposImovel } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltrosImoveis } from "@/components/ui/filtros-imoveis";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";

type ListaImoveis = {
  dados: {
    id: string;
    codigo: string;
    tipo: string;
    finalidade: string;
    situacao: string;
    cidade: string;
    bairro: string;
    area: number;
    quartos: number;
    valorVenda: number | null;
    valorAluguel: number | null;
    nomeProprietario: string | null;
  }[];
  total: number;
};

export default async function PaginaImoveis({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  const params = await searchParams;
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  for (const [chave, valor] of Object.entries(params)) {
    if (valor && chave !== "pagina") consulta.set(chave, valor);
  }
  const resultado = await api<ListaImoveis>(`/imoveis?${consulta.toString()}`);
  const extras = { ...params };
  delete extras.busca;
  delete extras.pagina;

  return (
    <main className="flex flex-1 flex-col gap-4 px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Imóveis</h1>
        {canWrite(session?.user?.role) ? (
          <Link href="/imoveis/novo" className={buttonVariants({ variant: "primary" })}>
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca acao="/imoveis" valor={params.busca} placeholder="Código, endereço ou cidade" extras={extras} />
        <FiltrosImoveis />
      </div>
      <Tabela
        rotulo="Imóveis"
        colunas={["Código", "Tipo", "Situação", "Local", "Valor"]}
        linhas={resultado.dados.map((imovel) => ({
          id: imovel.id,
          celulas: [
            <Link key="codigo" href={`/imoveis/${imovel.id}`}>
              {imovel.codigo}
            </Link>,
            rotuloDe(tiposImovel, imovel.tipo),
            <span key="situacao" className="flex flex-wrap gap-1">
              <Etiqueta valor={imovel.situacao} rotulo={rotuloDe(situacoes, imovel.situacao)} />
              <Etiqueta valor={imovel.finalidade} rotulo={rotuloDe(finalidades, imovel.finalidade)} />
            </span>,
            `${imovel.bairro}, ${imovel.cidade}`,
            [imovel.valorVenda != null ? dinheiro(imovel.valorVenda) : null, imovel.valorAluguel != null ? dinheiro(imovel.valorAluguel) : null]
              .filter(Boolean)
              .join(" · ") || "—",
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

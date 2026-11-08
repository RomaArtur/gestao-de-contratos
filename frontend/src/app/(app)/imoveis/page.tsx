import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { dinheiro, finalidades, rotuloDe, situacoes, tiposImovel } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { icones, TituloPagina } from "@/components/icones";
import { MenuAcoes } from "@/components/ui/menu-acoes";
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
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.imoveis}>Imóveis</TituloPagina>
        {canWrite(session?.user?.role) ? (
          <Link href="/imoveis/novo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
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
        colunas={["Código", "Tipo", "Situação", "Finalidade", "Local", "Valor", "Ações"]}
        linhas={resultado.dados.map((imovel) => ({
          id: imovel.id,
          celulas: [
            <Link key="codigo" href={`/imoveis/${imovel.id}`}>
              {imovel.codigo}
            </Link>,
            rotuloDe(tiposImovel, imovel.tipo),
            <Etiqueta key="situacao" valor={imovel.situacao} rotulo={rotuloDe(situacoes, imovel.situacao)} />,
            <Etiqueta key="finalidade" valor={imovel.finalidade} rotulo={rotuloDe(finalidades, imovel.finalidade)} />,
            `${imovel.bairro}, ${imovel.cidade}`,
            [imovel.valorVenda != null ? dinheiro(imovel.valorVenda) : null, imovel.valorAluguel != null ? dinheiro(imovel.valorAluguel) : null]
              .filter(Boolean)
              .join(" · ") || "—",
            <MenuAcoes key="acoes" rotulo={`Ações de ${imovel.codigo}`} acoes={[{ id: "ver", rotulo: "Visualizar", href: `/imoveis/${imovel.id}` }]} />,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

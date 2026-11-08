import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { rotuloDe, tiposPessoa } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { icones, TituloPagina } from "@/components/icones";
import { MenuAcoes } from "@/components/ui/menu-acoes";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltroMenu } from "@/components/ui/filtro-menu";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";

type ListaProprietarios = {
  dados: {
    id: string;
    tipoPessoa: string;
    nome: string;
    documento: string;
    email: string;
    cidade: string;
    uf: string;
  }[];
  total: number;
};

export default async function PaginaProprietarios({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tipoPessoa?: string; pagina?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  if (params.busca) consulta.set("busca", params.busca);
  if (params.tipoPessoa) consulta.set("tipoPessoa", params.tipoPessoa);
  const resultado = await api<ListaProprietarios>(`/proprietarios?${consulta.toString()}`);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.proprietarios}>Proprietários</TituloPagina>
        {canWrite(session?.user?.role) ? (
          <Link href="/proprietarios/novo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca
          acao="/proprietarios"
          valor={params.busca}
          placeholder="Nome, e-mail ou documento"
          extras={{ tipoPessoa: params.tipoPessoa }}
        />
        <FiltroMenu nome="tipoPessoa" rotulo="Tipo" opcoes={tiposPessoa} />
      </div>
      <Tabela
        rotulo="Proprietários"
        colunas={["Nome", "Tipo", "Documento", "Cidade", "Ações"]}
        linhas={resultado.dados.map((proprietario) => ({
          id: proprietario.id,
          celulas: [
            <Link key="nome" href={`/proprietarios/${proprietario.id}`}>
              {proprietario.nome}
            </Link>,
            <Etiqueta key="tipo" valor={proprietario.tipoPessoa} rotulo={rotuloDe(tiposPessoa, proprietario.tipoPessoa)} />,
            proprietario.documento,
            `${proprietario.cidade}/${proprietario.uf}`,
            <MenuAcoes key="acoes" rotulo={`Ações de ${proprietario.nome}`} acoes={[{ id: "ver", rotulo: "Visualizar", href: `/proprietarios/${proprietario.id}` }]} />,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { rotuloDe, tiposPessoa } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
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
    <main className="flex flex-1 flex-col gap-4 px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Proprietários</h1>
        {canWrite(session?.user?.role) ? (
          <Link href="/proprietarios/novo" className={buttonVariants({ variant: "primary" })}>
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
        colunas={["Nome", "Tipo", "Documento", "Cidade"]}
        linhas={resultado.dados.map((proprietario) => ({
          id: proprietario.id,
          celulas: [
            <Link key="nome" href={`/proprietarios/${proprietario.id}`}>
              {proprietario.nome}
            </Link>,
            <Etiqueta key="tipo" valor={proprietario.tipoPessoa} rotulo={rotuloDe(tiposPessoa, proprietario.tipoPessoa)} />,
            proprietario.documento,
            `${proprietario.cidade}/${proprietario.uf}`,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

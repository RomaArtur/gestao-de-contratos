import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { rotuloDe, tiposCliente } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Busca } from "@/components/ui/busca";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FiltroMenu } from "@/components/ui/filtro-menu";
import { Paginacao } from "@/components/ui/paginacao";
import { Tabela } from "@/components/ui/tabela";

type ListaClientes = {
  dados: {
    id: string;
    nome: string;
    documento: string;
    tipo: string;
    telefone: string;
    cidade: string;
    uf: string;
  }[];
  total: number;
};

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tipo?: string; pagina?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const consulta = new URLSearchParams({ pagina: params.pagina ?? "1", tamanhoPagina: "20" });
  if (params.busca) consulta.set("busca", params.busca);
  if (params.tipo) consulta.set("tipo", params.tipo);
  const resultado = await api<ListaClientes>(`/clientes?${consulta.toString()}`);

  return (
    <main className="flex flex-1 flex-col gap-4 px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        {canWrite(session?.user?.role) ? (
          <Link href="/clientes/novo" className={buttonVariants({ variant: "primary" })}>
            Novo
          </Link>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Busca acao="/clientes" valor={params.busca} placeholder="Nome, telefone ou documento" extras={{ tipo: params.tipo }} />
        <FiltroMenu nome="tipo" rotulo="Tipo" opcoes={tiposCliente} />
      </div>
      <Tabela
        rotulo="Clientes"
        colunas={["Nome", "Tipo", "Documento", "Cidade"]}
        linhas={resultado.dados.map((cliente) => ({
          id: cliente.id,
          celulas: [
            <Link key="nome" href={`/clientes/${cliente.id}`}>
              {cliente.nome}
            </Link>,
            <Etiqueta key="tipo" valor={cliente.tipo} rotulo={rotuloDe(tiposCliente, cliente.tipo)} />,
            cliente.documento,
            `${cliente.cidade}/${cliente.uf}`,
          ],
        }))}
      />
      <Paginacao total={resultado.total} />
    </main>
  );
}

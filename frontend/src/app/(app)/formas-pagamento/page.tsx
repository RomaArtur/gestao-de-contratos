import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { buttonVariants } from "@heroui/styles";
import { api } from "@/lib/api";
import { canWrite } from "@/lib/permissions";
import { Plus } from "lucide-react";
import { icones, TituloPagina } from "@/components/icones";
import { MenuAcoes } from "@/components/ui/menu-acoes";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Tabela } from "@/components/ui/tabela";

type Forma = { id: string; nome: string; ativo: boolean };

export default async function PaginaFormasPagamento() {
  const session = await auth();
  const formas = await api<Forma[]>("/formas-pagamento");
  const podeEscrever = canWrite(session?.user?.role);

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.pagamentos}>Formas de pagamento</TituloPagina>
        {podeEscrever ? (
          <Link href="/formas-pagamento/novo" className={buttonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        ) : null}
      </div>
      <Tabela
        rotulo="Formas de pagamento"
        colunas={["Nome", "Situação", "Ações"]}
        linhas={formas.map((forma) => ({
          id: forma.id,
          celulas: [
            <Link key="nome" href={`/formas-pagamento/${forma.id}`}>{forma.nome}</Link>,
            <Etiqueta key="ativa" valor={forma.ativo ? "VIGENTE" : "CANCELADO"} rotulo={forma.ativo ? "Ativa" : "Inativa"} />,
            <MenuAcoes key="acoes" rotulo={`Ações de ${forma.nome}`} acoes={[{ id: "ver", rotulo: "Visualizar", href: `/formas-pagamento/${forma.id}` }]} />,
          ],
        }))}
      />
    </main>
  );
}

import { Card, Link } from "@heroui/react";
import { api } from "@/lib/api";
import { Indicador } from "@/components/ui/indicador";

type Lista = { total: number };

export default async function HomePage() {
  const [imoveis, disponiveis, propostas, enviadas, contratos, vigentes] = await Promise.all([
    api<Lista>("/imoveis?tamanhoPagina=1"),
    api<Lista>("/imoveis?situacao=DISPONIVEL&tamanhoPagina=1"),
    api<Lista>("/propostas?tamanhoPagina=1"),
    api<Lista>("/propostas?situacao=ENVIADA&tamanhoPagina=1"),
    api<Lista>("/contratos?tamanhoPagina=1"),
    api<Lista>("/contratos?situacao=VIGENTE&tamanhoPagina=1"),
  ]);

  const cartoes = [
    {
      titulo: "Disponíveis",
      valor: disponiveis.total,
      total: imoveis.total,
      href: "/imoveis?situacao=DISPONIVEL",
    },
    {
      titulo: "Enviadas",
      valor: enviadas.total,
      total: propostas.total,
      href: "/propostas?situacao=ENVIADA",
    },
    {
      titulo: "Vigentes",
      valor: vigentes.total,
      total: contratos.total,
      href: "/contratos?situacao=VIGENTE",
    },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {cartoes.map((cartao) => {
          const percentual = cartao.total === 0 ? 0 : Math.round((cartao.valor / cartao.total) * 100);
          return (
            <Link key={cartao.href} href={cartao.href} className="block">
              <Card>
                <Card.Content className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted">{cartao.titulo}</p>
                    <p className="text-3xl font-semibold tracking-tight">{cartao.valor}</p>
                  </div>
                  <Indicador rotulo={cartao.titulo} valor={percentual} />
                </Card.Content>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

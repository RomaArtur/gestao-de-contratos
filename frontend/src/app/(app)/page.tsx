import { Link } from "@heroui/react";
import { api } from "@/lib/api";
import { situacoes, situacoesContrato, situacoesProposta } from "@/lib/labels";
import { GraficoBarras } from "@/components/grafico-barras";
import { icones, TituloPagina } from "@/components/icones";
import { Card, CardContent } from "@/components/ui/card";
import { Tabela } from "@/components/ui/tabela";

type Contagem = { situacao: string; total: number };
type Pendencia = { tipo: "imovel" | "contrato"; id: string; titulo: string; detalhe: string };
type Painel = {
  imoveis: number;
  propostas: number;
  contratos: number;
  contratosAtivos: number;
  contratosVencidos: number;
  contratosProximos: number;
  documentosPendentes: number;
  limitePendencias: number;
  imoveisPorSituacao: Contagem[];
  propostasPorSituacao: Contagem[];
  contratosPorSituacao: Contagem[];
  pendencias: Pendencia[];
};

function serie(opcoes: readonly (readonly [string, string])[], dados: Contagem[]) {
  const conhecidas = new Set<string>(opcoes.map(([valor]) => valor));
  const base = opcoes.map(([valor, rotulo]) => ({
    rotulo,
    total: dados.find((item) => item.situacao === valor)?.total ?? 0,
  }));
  const extras = dados
    .filter((item) => !conhecidas.has(item.situacao))
    .map((item) => ({ rotulo: item.situacao, total: item.total }));
  return [...base, ...extras];
}

function Cartao({
  titulo,
  valor,
  detalhe,
  href,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
  href: string;
  icone: (typeof icones)[keyof typeof icones];
}) {
  return (
    <Link href={href} className="block h-full w-full">
      <Card className="h-full w-full">
        <CardContent className="flex h-full flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{titulo}</p>
            <Icone className="size-4 shrink-0 text-accent" aria-hidden />
          </div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{valor}</p>
          <p className="mt-auto text-xs text-muted">{detalhe}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function HomePage() {
  const painel = await api<Painel>("/painel");
  const cadastros = [
    { titulo: "Imóveis", valor: painel.imoveis, detalhe: "cadastrados", href: "/imoveis", icone: icones.imoveis },
    { titulo: "Propostas", valor: painel.propostas, detalhe: "cadastradas", href: "/propostas", icone: icones.propostas },
    { titulo: "Contratos", valor: painel.contratos, detalhe: "cadastrados", href: "/contratos", icone: icones.contratos },
    {
      titulo: "Documentos pendentes",
      valor: painel.documentosPendentes,
      detalhe: "imóveis sem anexo ou contratos sem assinatura",
      href: "#pendencias",
      icone: icones.documentos,
    },
  ];
  const vigencia = [
    { titulo: "Contratos ativos", valor: painel.contratosAtivos, detalhe: "vigentes em dia", href: "/contratos?recorte=ativos", icone: icones.ativos },
    { titulo: "Vencidos", valor: painel.contratosVencidos, detalhe: "vigentes com prazo encerrado", href: "/contratos?recorte=vencidos", icone: icones.vencidos },
    {
      titulo: "Próximos do vencimento",
      valor: painel.contratosProximos,
      detalhe: "vigentes nos próximos 30 dias",
      href: "/contratos?recorte=proximos",
      icone: icones.proximos,
    },
  ];

  return (
    <main className="pagina">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TituloPagina icone={icones.painel}>Painel</TituloPagina>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cadastros.map((cartao) => (
          <Cartao key={cartao.titulo} {...cartao} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {vigencia.map((cartao) => (
          <Cartao key={cartao.titulo} {...cartao} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <GraficoBarras titulo="Imóveis por situação" itens={serie(situacoes, painel.imoveisPorSituacao)} icone={icones.imoveis} />
        <GraficoBarras titulo="Propostas por situação" itens={serie(situacoesProposta, painel.propostasPorSituacao)} icone={icones.propostas} />
        <GraficoBarras titulo="Contratos por situação" itens={serie(situacoesContrato, painel.contratosPorSituacao)} icone={icones.contratos} />
      </div>
      <section id="pendencias" className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <icones.documentos className="size-5 text-accent" aria-hidden />
          Documentos pendentes
        </h2>
        <p className="text-sm text-muted">
          {painel.documentosPendentes} pendência(s).{" "}
          {painel.pendencias.length < painel.documentosPendentes
            ? `A lista mostra ${painel.pendencias.length} de ${painel.documentosPendentes}, com no máximo ${painel.limitePendencias} imóveis sem documento e ${painel.limitePendencias} contratos sem o arquivo assinado.`
            : "A lista mostra imóveis sem documento e contratos em minuta ou vigentes sem o arquivo assinado."}
        </p>
        <Tabela
          rotulo="Documentos pendentes"
          colunas={["Cadastro", "Pendência"]}
          linhas={painel.pendencias.map((item) => ({
            id: `${item.tipo}-${item.id}`,
            celulas: [
              <Link key="titulo" href={item.tipo === "imovel" ? `/imoveis/${item.id}` : `/contratos/${item.id}`}>
                {item.titulo}
              </Link>,
              item.detalhe,
            ],
          }))}
        />
      </section>
    </main>
  );
}

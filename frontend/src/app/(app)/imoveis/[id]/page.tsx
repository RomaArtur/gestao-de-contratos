import { auth } from "@/auth";
import { api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";
import { rotuloDe, situacoes } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FormularioImovel } from "../formulario-imovel";
import { MidiaImovel } from "../midia-imovel";

type Imovel = {
  id: string;
  codigo: string;
  proprietarioId: string;
  tipo: string;
  finalidade: "VENDA" | "ALUGUEL" | "VENDA_ALUGUEL";
  situacao: string;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  descricao: string | null;
  valorVenda: number | null;
  valorAluguel: number | null;
  valorCondominio: number | null;
  valorIptu: number | null;
  endereco: EnderecoFormulario & { complemento: string | null };
  fotos: { id: string; url: string; nomeOriginal: string; principal: boolean }[];
  documentos: { id: string; url: string; nomeOriginal: string; categoria: string }[];
};

export default async function PaginaImovel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const [imovel, proprietarios] = await Promise.all([
    api<Imovel>(`/imoveis/${id}`),
    api<{ dados: { id: string; nome: string }[] }>("/proprietarios?tamanhoPagina=200"),
  ]);
  const somenteLeitura = !canWrite(session?.user?.role);

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{imovel.codigo}</h1>
        <Etiqueta valor={imovel.situacao} rotulo={rotuloDe(situacoes, imovel.situacao)} />
      </div>
      <Abas
        itens={[
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
      <FormularioImovel
        imovelId={imovel.id}
        somenteLeitura={somenteLeitura}
        proprietarios={proprietarios.dados}
        valoresIniciais={{
          codigo: imovel.codigo,
          proprietarioId: imovel.proprietarioId,
          tipo: imovel.tipo,
          finalidade: imovel.finalidade,
          situacao: imovel.situacao,
          area: String(imovel.area),
          quartos: String(imovel.quartos),
          banheiros: String(imovel.banheiros),
          vagas: String(imovel.vagas),
          descricao: imovel.descricao ?? "",
          valorVenda: imovel.valorVenda == null ? "" : String(imovel.valorVenda),
          valorAluguel: imovel.valorAluguel == null ? "" : String(imovel.valorAluguel),
          valorCondominio: imovel.valorCondominio == null ? "" : String(imovel.valorCondominio),
          valorIptu: imovel.valorIptu == null ? "" : String(imovel.valorIptu),
          endereco: { ...imovel.endereco, complemento: imovel.endereco.complemento ?? "" },
        }}
      />
            ),
          },
          {
            id: "midia",
            titulo: "Mídia",
            conteudo: (
              <MidiaImovel
                imovelId={imovel.id}
                somenteLeitura={somenteLeitura}
                fotos={imovel.fotos}
                documentos={imovel.documentos}
              />
            ),
          },
        ]}
      />
    </main>
  );
}

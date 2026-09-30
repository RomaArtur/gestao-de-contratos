import { api } from "@/lib/api";
import { dinheiro } from "@/lib/labels";
import { FormularioContrato } from "../formulario-contrato";

type Proposta = {
  id: string;
  codigoImovel: string | null;
  nomeCliente: string | null;
  valor: number;
  situacao: string;
};

type Contrato = { propostaId: string };

export default async function PaginaNovoContrato() {
  const [propostas, contratos] = await Promise.all([
    api<{ dados: Proposta[] }>("/propostas?situacao=ACEITA&tamanhoPagina=100"),
    api<{ dados: Contrato[] }>("/contratos?tamanhoPagina=100"),
  ]);
  const usadas = new Set(contratos.dados.map((contrato) => contrato.propostaId));
  const disponiveis = propostas.dados.filter((proposta) => !usadas.has(proposta.id));

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Novo contrato</h1>
      {disponiveis.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma proposta aceita disponível para gerar contrato.</p>
      ) : (
        <FormularioContrato
          propostas={disponiveis.map((proposta) => ({
            id: proposta.id,
            rotulo: `${proposta.codigoImovel} — ${proposta.nomeCliente} — ${dinheiro(proposta.valor)}`,
          }))}
          valoresIniciais={{
            propostaId: "",
            dataInicio: "",
            vencimento: "",
            observacoes: "",
          }}
        />
      )}
    </main>
  );
}

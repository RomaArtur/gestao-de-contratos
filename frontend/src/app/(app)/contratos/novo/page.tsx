import { api, listarTudo } from "@/lib/api";
import { dinheiro } from "@/lib/labels";
import { FormularioContrato, type OpcaoProposta } from "../formulario-contrato";

type Proposta = {
  id: string;
  imovelId: string;
  clienteId: string;
  codigoImovel: string | null;
  nomeCliente: string | null;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  formaPagamentoId: string | null;
};

type Contrato = { propostaId: string | null };
type Cadastro = { id: string; codigo?: string; nome?: string; nomeProprietario?: string | null };
type Forma = { id: string; nome: string; ativo: boolean };

export default async function PaginaNovoContrato() {
  const [propostas, contratos, imoveis, clientes, formas] = await Promise.all([
    listarTudo<Proposta>("/propostas?situacao=ACEITA"),
    listarTudo<Contrato>("/contratos"),
    listarTudo<Cadastro>("/imoveis"),
    listarTudo<Cadastro>("/clientes"),
    api<Forma[]>("/formas-pagamento?somenteAtivas=1"),
  ]);
  const usadas = new Set(contratos.map((contrato) => contrato.propostaId).filter(Boolean));
  const disponiveis: OpcaoProposta[] = propostas
    .filter((proposta) => !usadas.has(proposta.id))
    .map((proposta) => ({
      id: proposta.id,
      rotulo: `${proposta.codigoImovel} — ${proposta.nomeCliente} — ${dinheiro(proposta.valor)}`,
      imovelId: proposta.imovelId,
      clienteId: proposta.clienteId,
      finalidade: proposta.finalidade,
      valor: proposta.valor,
      formaPagamentoId: proposta.formaPagamentoId,
    }));

  return (
    <main className="pagina">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo contrato</h1>
        <p className="text-sm text-muted">
          Gere a partir de uma proposta aceita ou cadastre o contrato vinculado ao imóvel, ao proprietário do imóvel e ao cliente.
        </p>
      </div>
      <FormularioContrato
        propostas={disponiveis}
        imoveis={imoveis.map((item) => ({
          id: item.id,
          rotulo: item.nomeProprietario ? `${item.codigo} — ${item.nomeProprietario}` : item.codigo ?? item.id,
        }))}
        clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
        formas={formas.map((forma) => ({ id: forma.id, rotulo: forma.nome }))}
        valoresIniciais={{
          propostaId: "",
          imovelId: "",
          clienteId: "",
          finalidade: "VENDA",
          valor: 0,
          formaPagamentoId: "",
          dataInicio: "",
          vencimento: "",
          observacoes: "",
        }}
      />
    </main>
  );
}

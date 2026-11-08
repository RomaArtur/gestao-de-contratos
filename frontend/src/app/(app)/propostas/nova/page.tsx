import { api, listarTudo } from "@/lib/api";
import { FormularioProposta } from "../formulario-proposta";

type Cadastro = { id: string; codigo?: string; nome?: string };
type Forma = { id: string; nome: string };

export default async function PaginaNovaProposta() {
  const [imoveis, clientes, formas] = await Promise.all([
    listarTudo<Cadastro>("/imoveis"),
    listarTudo<Cadastro>("/clientes"),
    api<Forma[]>("/formas-pagamento?somenteAtivas=1"),
  ]);

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Nova proposta</h1>
      <FormularioProposta
        imoveis={imoveis.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
        clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
        formas={formas.map((forma) => ({ id: forma.id, rotulo: forma.nome }))}
        valoresIniciais={{
          imovelId: "",
          clienteId: "",
          finalidade: "VENDA",
          valor: 0,
          condicoes: "",
          validade: "",
          formaPagamentoId: "",
        }}
      />
    </main>
  );
}

import { api } from "@/lib/api";
import { FormularioProposta } from "../formulario-proposta";

type Lista = { dados: { id: string; codigo?: string; nome?: string }[] };

export default async function PaginaNovaProposta() {
  const [imoveis, clientes] = await Promise.all([
    api<Lista>("/imoveis?tamanhoPagina=100"),
    api<Lista>("/clientes?tamanhoPagina=100"),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Nova proposta</h1>
      <FormularioProposta
        imoveis={imoveis.dados.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
        clientes={clientes.dados.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
        valoresIniciais={{
          imovelId: "",
          clienteId: "",
          finalidade: "VENDA",
          valor: 0,
          condicoes: "",
          validade: "",
        }}
      />
    </main>
  );
}

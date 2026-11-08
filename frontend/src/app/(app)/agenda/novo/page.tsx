import { listarTudo } from "@/lib/api";
import { hojeLocal, instanteDoDia } from "@/lib/calendario";
import { FormularioEvento } from "../formulario-evento";

type Cadastro = { id: string; codigo?: string; nome?: string; nomeProprietario?: string | null };

export default async function PaginaNovoEvento({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const params = await searchParams;
  const data = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "") ? params.data! : hojeLocal();
  const [imoveis, clientes, contratos] = await Promise.all([
    listarTudo<Cadastro>("/imoveis"),
    listarTudo<Cadastro>("/clientes"),
    listarTudo<Cadastro>("/contratos"),
  ]);

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
      <FormularioEvento
        imoveis={imoveis.map((item) => ({
          id: item.id,
          rotulo: item.nomeProprietario ? `${item.codigo} — ${item.nomeProprietario}` : item.codigo ?? item.id,
        }))}
        clientes={clientes.map((item) => ({ id: item.id, rotulo: item.nome ?? item.id }))}
        contratos={contratos.map((item) => ({ id: item.id, rotulo: item.codigo ?? item.id }))}
        valoresIniciais={{
          titulo: "",
          tipo: "VISITA",
          inicio: instanteDoDia(data, "09:00"),
          fim: instanteDoDia(data, "10:00"),
          descricao: "",
          imovelId: "",
          clienteId: "",
          contratoId: "",
        }}
      />
    </main>
  );
}

import Link from "next/link";
import { auth } from "@/auth";
import { listarTudo } from "@/lib/api";
import { enderecoVazio } from "@/lib/endereco";
import { canWrite } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { FormularioImovel } from "../formulario-imovel";

export default async function PaginaNovoImovel() {
  const session = await auth();
  if (!canWrite(session?.user?.role)) redirect("/imoveis");
  const proprietarios = await listarTudo<{ id: string; nome: string }>("/proprietarios", 200);

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Novo imóvel</h1>
      {proprietarios.length === 0 ? (
        <p className="text-sm text-muted">
          Cadastre um <Link className="underline" href="/proprietarios/novo">proprietário</Link> antes de criar o imóvel.
        </p>
      ) : (
        <FormularioImovel
          proprietarios={proprietarios}
          valoresIniciais={{
            codigo: "",
            proprietarioId: "",
            tipo: "APARTAMENTO",
            finalidade: "VENDA",
            situacao: "DISPONIVEL",
            area: "",
            quartos: "0",
            banheiros: "0",
            vagas: "0",
            descricao: "",
            valorVenda: "",
            valorAluguel: "",
            valorCondominio: "",
            valorIptu: "",
            endereco: enderecoVazio,
          }}
        />
      )}
    </main>
  );
}

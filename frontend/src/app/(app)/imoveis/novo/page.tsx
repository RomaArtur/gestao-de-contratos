import Link from "next/link";
import { auth } from "@/auth";
import { api } from "@/lib/api";
import { enderecoVazio } from "@/lib/endereco";
import { canWrite } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { FormularioImovel } from "../formulario-imovel";

export default async function PaginaNovoImovel() {
  const session = await auth();
  if (!canWrite(session?.user?.role)) redirect("/imoveis");
  const proprietarios = await api<{ dados: { id: string; nome: string }[] }>("/proprietarios?tamanhoPagina=200");

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Novo imóvel</h1>
      {proprietarios.dados.length === 0 ? (
        <p className="text-sm text-muted">
          Cadastre um <Link className="underline" href="/proprietarios/novo">proprietário</Link> antes de criar o imóvel.
        </p>
      ) : (
        <FormularioImovel
          proprietarios={proprietarios.dados}
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

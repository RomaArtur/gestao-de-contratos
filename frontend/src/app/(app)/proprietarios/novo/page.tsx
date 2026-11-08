import { auth } from "@/auth";
import { enderecoVazio } from "@/lib/endereco";
import { canWrite } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { FormularioProprietario } from "../formulario-proprietario";

export default async function PaginaNovoProprietario() {
  const session = await auth();
  if (!canWrite(session?.user?.role)) redirect("/proprietarios");

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Novo proprietário</h1>
      <FormularioProprietario
        valoresIniciais={{
          tipoPessoa: "FISICA",
          nome: "",
          nomeFantasia: "",
          documento: "",
          dataNascimento: "",
          telefone: "",
          email: "",
          nomeResponsavel: "",
          endereco: enderecoVazio,
        }}
      />
    </main>
  );
}

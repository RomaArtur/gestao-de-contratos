import { auth } from "@/auth";
import { api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";
import { canWrite } from "@/lib/permissions";
import { FormularioProprietario } from "../formulario-proprietario";

type Proprietario = {
  id: string;
  tipoPessoa: "FISICA" | "JURIDICA";
  nome: string;
  nomeFantasia: string | null;
  documento: string;
  dataNascimento: string | null;
  telefone: string;
  email: string;
  nomeResponsavel: string | null;
  endereco: EnderecoFormulario & { complemento: string | null };
};

export default async function PaginaProprietario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const proprietario = await api<Proprietario>(`/proprietarios/${id}`);

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{proprietario.nome}</h1>
      <FormularioProprietario
        proprietarioId={proprietario.id}
        somenteLeitura={!canWrite(session?.user?.role)}
        valoresIniciais={{
          tipoPessoa: proprietario.tipoPessoa,
          nome: proprietario.nome,
          nomeFantasia: proprietario.nomeFantasia ?? "",
          documento: proprietario.documento,
          dataNascimento: proprietario.dataNascimento ?? "",
          telefone: proprietario.telefone,
          email: proprietario.email,
          nomeResponsavel: proprietario.nomeResponsavel ?? "",
          endereco: { ...proprietario.endereco, complemento: proprietario.endereco.complemento ?? "" },
        }}
      />
    </main>
  );
}

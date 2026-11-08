import { auth } from "@/auth";
import { api } from "@/lib/api";
import { canWrite } from "@/lib/permissions";
import { FormularioForma } from "../formulario-forma";

type Forma = { id: string; nome: string; ativo: boolean };

export default async function PaginaForma({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const forma = await api<Forma>(`/formas-pagamento/${id}`);

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">{forma.nome}</h1>
      <FormularioForma
        formaId={forma.id}
        somenteLeitura={!canWrite(session?.user?.role)}
        valoresIniciais={{ nome: forma.nome, ativo: forma.ativo }}
      />
    </main>
  );
}

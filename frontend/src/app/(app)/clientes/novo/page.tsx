import { auth } from "@/auth";
import { enderecoVazio } from "@/lib/endereco";
import { canWrite } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { FormularioCliente } from "../formulario-cliente";

export default async function PaginaNovoCliente() {
  const session = await auth();
  if (!canWrite(session?.user?.role)) redirect("/clientes");

  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
      <FormularioCliente
        valoresIniciais={{
          nome: "",
          documento: "",
          telefone: "",
          whatsapp: "",
          email: "",
          tipo: "COMPRADOR",
          observacoes: "",
          endereco: enderecoVazio,
        }}
      />
    </main>
  );
}

import { FormularioForma } from "../formulario-forma";

export default function PaginaNovaForma() {
  return (
    <main className="pagina">
      <h1 className="text-2xl font-semibold tracking-tight">Nova forma de pagamento</h1>
      <FormularioForma valoresIniciais={{ nome: "", ativo: true }} />
    </main>
  );
}

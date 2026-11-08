import { api } from "@/lib/api";
import { ImprimirContrato } from "./imprimir";

export default async function PaginaPdfContrato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contrato = await api<{ codigo: string; conteudo: string | null }>(`/contratos/${id}`);

  return (
    <main className="mx-auto max-w-3xl bg-white px-10 py-10 text-black">
      <div className="nao-imprimir mb-6">
        <ImprimirContrato codigo={contrato.codigo} />
      </div>
      {contrato.conteudo ? (
        <article className="documento text-sm" dangerouslySetInnerHTML={{ __html: contrato.conteudo }} />
      ) : (
        <p>Este contrato não possui documento gerado.</p>
      )}
    </main>
  );
}

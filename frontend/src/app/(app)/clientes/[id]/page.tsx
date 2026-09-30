import { Link } from "@heroui/react";
import { auth } from "@/auth";
import { api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";
import { dinheiro, rotuloDe, situacoesContrato, situacoesProposta } from "@/lib/labels";
import { canWrite } from "@/lib/permissions";
import { Abas } from "@/components/ui/abas";
import { Etiqueta } from "@/components/ui/etiqueta";
import { FormularioCliente } from "../formulario-cliente";

type Cliente = {
  id: string;
  nome: string;
  documento: string;
  telefone: string;
  whatsapp: string | null;
  email: string;
  tipo: "COMPRADOR" | "LOCATARIO" | "INVESTIDOR" | "EMPRESA" | "OUTROS";
  observacoes: string | null;
  endereco: EnderecoFormulario & { complemento: string | null };
  historico: {
    propostas: { id: string; codigoImovel: string | null; valor: number; situacao: string; finalidade: string }[];
    contratos: {
      id: string;
      codigo: string;
      codigoImovel: string | null;
      valor: number;
      situacao: string;
      vencimento: string;
    }[];
  };
};

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const cliente = await api<Cliente>(`/clientes/${id}`);

  return (
    <main className="flex flex-1 flex-col gap-6 px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
      <Abas
        itens={[
          {
            id: "dados",
            titulo: "Dados",
            conteudo: (
      <FormularioCliente
        clienteId={cliente.id}
        somenteLeitura={!canWrite(session?.user?.role)}
        valoresIniciais={{
          nome: cliente.nome,
          documento: cliente.documento,
          telefone: cliente.telefone,
          whatsapp: cliente.whatsapp ?? "",
          email: cliente.email,
          tipo: cliente.tipo,
          observacoes: cliente.observacoes ?? "",
          endereco: { ...cliente.endereco, complemento: cliente.endereco.complemento ?? "" },
        }}
      />
            ),
          },
          {
            id: "propostas",
            titulo: "Propostas",
            conteudo: (
              <ul className="flex flex-col gap-2 text-sm">
                {cliente.historico.propostas.map((proposta) => (
                  <li key={proposta.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/propostas/${proposta.id}`}>{proposta.codigoImovel}</Link>
                    <span>{dinheiro(proposta.valor)}</span>
                    <Etiqueta valor={proposta.situacao} rotulo={rotuloDe(situacoesProposta, proposta.situacao)} />
                  </li>
                ))}
              </ul>
            ),
          },
          {
            id: "contratos",
            titulo: "Contratos",
            conteudo: (
              <ul className="flex flex-col gap-2 text-sm">
                {cliente.historico.contratos.map((contrato) => (
                  <li key={contrato.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/contratos/${contrato.id}`}>{contrato.codigo}</Link>
                    <span>{dinheiro(contrato.valor)}</span>
                    <Etiqueta valor={contrato.situacao} rotulo={rotuloDe(situacoesContrato, contrato.situacao)} />
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </main>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";

export type DadosProposta = {
  imovelId: string;
  clienteId: string;
  finalidade: "VENDA" | "ALUGUEL";
  valor: number;
  condicoes?: string;
  validade?: string;
};

export async function salvarProposta(id: string | null, dados: DadosProposta) {
  try {
    const salva = await api<{ id: string }>(id ? `/propostas/${id}` : "/propostas", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/propostas");
    redirect(`/propostas/${salva.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirProposta(id: string) {
  try {
    await api(`/propostas/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/propostas");
  redirect("/propostas");
}

export async function enviarProposta(id: string) {
  return executar(id, `/propostas/${id}/enviar`, {});
}

export async function aceitarProposta(id: string) {
  return executar(id, `/propostas/${id}/aceitar`, {});
}

export async function recusarProposta(id: string, motivo: string) {
  return executar(id, `/propostas/${id}/recusar`, { motivo });
}

export async function cancelarProposta(id: string, motivo: string) {
  return executar(id, `/propostas/${id}/cancelar`, { motivo });
}

async function executar(id: string, caminho: string, corpo: Record<string, string>) {
  try {
    await api(caminho, { method: "POST", body: JSON.stringify(corpo) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
  redirect(`/propostas/${id}`);
}

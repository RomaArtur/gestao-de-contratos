"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";

export type DadosContrato = {
  propostaId: string;
  dataInicio: string;
  vencimento: string;
  observacoes?: string;
};

export type DadosAtualizacaoContrato = {
  dataInicio: string;
  vencimento: string;
  observacoes?: string;
};

export async function salvarContrato(id: string | null, dados: DadosContrato | DadosAtualizacaoContrato) {
  try {
    const salvo = await api<{ id: string }>(id ? `/contratos/${id}` : "/contratos", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/contratos");
    redirect(`/contratos/${salvo.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirContrato(id: string) {
  try {
    await api(`/contratos/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/contratos");
  redirect("/contratos");
}

export async function ativarContrato(id: string) {
  return executar(id, `/contratos/${id}/ativar`, {});
}

export async function encerrarContrato(id: string) {
  return executar(id, `/contratos/${id}/encerrar`, {});
}

export async function cancelarContrato(id: string, motivo: string) {
  return executar(id, `/contratos/${id}/cancelar`, { motivo });
}

export async function enviarDocumentoContrato(id: string, formData: FormData) {
  try {
    await api(`/contratos/${id}/documentos`, { method: "POST", body: formData });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

export async function removerDocumentoContrato(id: string, documentoId: string) {
  try {
    await api(`/contratos/${id}/documentos/${documentoId}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

async function executar(id: string, caminho: string, corpo: Record<string, string>) {
  try {
    await api(caminho, { method: "POST", body: JSON.stringify(corpo) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

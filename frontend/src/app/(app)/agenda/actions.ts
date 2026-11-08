"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";

export type DadosEvento = {
  titulo: string;
  tipo: "VISITA" | "REUNIAO" | "ASSINATURA" | "VENCIMENTO" | "COMPROMISSO";
  inicio: string;
  fim: string;
  descricao?: string;
  imovelId?: string;
  clienteId?: string;
  contratoId?: string;
};

export async function salvarEvento(id: string | null, dados: DadosEvento) {
  try {
    const salvo = await api<{ id: string }>(id ? `/agenda/${id}` : "/agenda", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/agenda");
    redirect(`/agenda/${salvo.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function cancelarEvento(id: string) {
  try {
    await api(`/agenda/${id}/cancelar`, { method: "POST", body: JSON.stringify({}) });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${id}`);
  redirect(`/agenda/${id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";

export type DadosForma = { nome: string; ativo: boolean };

export async function salvarForma(id: string | null, dados: DadosForma) {
  try {
    const salva = await api<{ id: string }>(id ? `/formas-pagamento/${id}` : "/formas-pagamento", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/formas-pagamento");
    redirect(`/formas-pagamento/${salva.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirForma(id: string) {
  try {
    await api(`/formas-pagamento/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/formas-pagamento");
  redirect("/formas-pagamento");
}

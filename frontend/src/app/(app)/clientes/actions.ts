"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";

export type DadosCliente = {
  nome: string;
  documento: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  tipo: "COMPRADOR" | "LOCATARIO" | "INVESTIDOR" | "EMPRESA" | "OUTROS";
  observacoes?: string;
  endereco: EnderecoFormulario;
};

export async function salvarCliente(id: string | null, dados: DadosCliente) {
  try {
    const salvo = await api<{ id: string }>(id ? `/clientes/${id}` : "/clientes", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/clientes");
    redirect(`/clientes/${salvo.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirCliente(id: string) {
  try {
    await api(`/clientes/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/clientes");
  redirect("/clientes");
}

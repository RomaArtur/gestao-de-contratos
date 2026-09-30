"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";

export type DadosProprietario = {
  tipoPessoa: "FISICA" | "JURIDICA";
  nome: string;
  nomeFantasia?: string;
  documento: string;
  dataNascimento?: string;
  telefone: string;
  email: string;
  nomeResponsavel?: string;
  endereco: EnderecoFormulario;
};

export async function salvarProprietario(id: string | null, dados: DadosProprietario) {
  try {
    const salvo = await api<{ id: string }>(id ? `/proprietarios/${id}` : "/proprietarios", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/proprietarios");
    redirect(`/proprietarios/${salvo.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirProprietario(id: string) {
  try {
    await api(`/proprietarios/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/proprietarios");
  redirect("/proprietarios");
}

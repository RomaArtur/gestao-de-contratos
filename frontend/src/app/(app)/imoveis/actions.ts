"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { EnderecoFormulario } from "@/lib/endereco";

export type DadosImovel = {
  codigo: string;
  proprietarioId: string;
  tipo: string;
  finalidade: string;
  situacao: string;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  descricao?: string;
  valorVenda: number | null;
  valorAluguel: number | null;
  valorCondominio: number | null;
  valorIptu: number | null;
  endereco: EnderecoFormulario;
};

export async function salvarImovel(id: string | null, dados: DadosImovel) {
  try {
    const salvo = await api<{ id: string }>(id ? `/imoveis/${id}` : "/imoveis", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(dados),
    });
    revalidatePath("/imoveis");
    redirect(id ? `/imoveis/${id}` : `/imoveis/${salvo.id}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function excluirImovel(id: string) {
  try {
    await api(`/imoveis/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/imoveis");
  redirect("/imoveis");
}

export async function enviarArquivoImovel(
  imovelId: string,
  tipo: "fotos" | "documentos",
  formData: FormData,
) {
  try {
    await api(`/imoveis/${imovelId}/${tipo}`, { method: "POST", body: formData });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  redirect(`/imoveis/${imovelId}`);
}

export async function definirFotoPrincipal(imovelId: string, fotoId: string) {
  await api(`/imoveis/${imovelId}/fotos/${fotoId}/principal`, { method: "PATCH" });
  redirect(`/imoveis/${imovelId}`);
}

export async function removerArquivoImovel(
  imovelId: string,
  tipo: "fotos" | "documentos",
  arquivoId: string,
) {
  await api(`/imoveis/${imovelId}/${tipo}/${arquivoId}`, { method: "DELETE" });
  redirect(`/imoveis/${imovelId}`);
}

export async function reordenarFotos(imovelId: string, ids: string[]) {
  await api(`/imoveis/${imovelId}/fotos/ordem`, {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
  redirect(`/imoveis/${imovelId}`);
}

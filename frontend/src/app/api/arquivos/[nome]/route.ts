import { auth } from "@/auth";
import { NextResponse } from "next/server";

type Contexto = { params: Promise<{ nome: string }> };

export async function GET(_request: Request, contexto: Contexto) {
  const session = await auth();
  if (!session?.accessToken) {
    return new NextResponse(null, { status: 401 });
  }

  const { nome } = await contexto.params;
  if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$/i.test(nome)) {
    return new NextResponse(null, { status: 400 });
  }

  const resposta = await fetch(`${process.env.API_URL}/api/v1/arquivos/${nome}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!resposta.ok || !resposta.body) {
    return new NextResponse(null, { status: resposta.status === 401 ? 401 : 404 });
  }

  return new NextResponse(resposta.body, {
    headers: {
      "Content-Type": resposta.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}

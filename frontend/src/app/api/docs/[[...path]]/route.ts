import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, contexto: Contexto) {
  const base = process.env.API_URL ?? process.env.PUBLIC_API_URL;
  if (!base) {
    return new NextResponse("API_URL não configurada", { status: 500 });
  }

  const { path } = await contexto.params;
  const destino = new URL(base);
  const trecho = path?.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
  destino.pathname = `/api/docs${trecho}`;
  destino.search = request.nextUrl.search;

  const resposta = await fetch(destino, { cache: "no-store" });
  const headers = new Headers();
  const tipo = resposta.headers.get("content-type");
  if (tipo) headers.set("content-type", tipo);
  headers.set("cache-control", "no-store");

  return new NextResponse(resposta.body, { status: resposta.status, headers });
}

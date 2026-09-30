"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/etiqueta";
import { fileUrl } from "@/lib/files";
import { categoriasDocumento, rotuloDe } from "@/lib/labels";
import {
  definirFotoPrincipal,
  enviarArquivoImovel,
  removerArquivoImovel,
  reordenarFotos,
} from "./actions";

type Foto = { id: string; url: string; nomeOriginal: string; principal: boolean };
type Documento = { id: string; url: string; nomeOriginal: string; categoria: string };

export function MidiaImovel({
  imovelId,
  somenteLeitura,
  fotos,
  documentos,
}: {
  imovelId: string;
  somenteLeitura: boolean;
  fotos: Foto[];
  documentos: Documento[];
}) {
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(tipo: "fotos" | "documentos", formData: FormData) {
    setErro(null);
    const resultado = await enviarArquivoImovel(imovelId, tipo, formData);
    if (resultado?.error) setErro(resultado.error);
  }

  function mover(indice: number, direcao: -1 | 1) {
    const proxima = [...fotos];
    const destino = indice + direcao;
    if (destino < 0 || destino >= proxima.length) return;
    const [item] = proxima.splice(indice, 1);
    proxima.splice(destino, 0, item);
    return reordenarFotos(imovelId, proxima.map((foto) => foto.id));
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto, indice) => (
            <figure key={foto.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-surface">
              <img src={fileUrl(foto.url) ?? ""} alt={foto.nomeOriginal} className="h-40 w-full object-cover" />
              <figcaption className="flex flex-wrap gap-2 p-3 text-sm">
                {foto.principal ? <Etiqueta valor="DISPONIVEL" rotulo="Principal" /> : null}
                {somenteLeitura ? null : (
                  <>
                    {foto.principal ? null : (
                      <button type="button" className="underline" onClick={() => definirFotoPrincipal(imovelId, foto.id)}>Definir principal</button>
                    )}
                    <button type="button" className="underline" onClick={() => mover(indice, -1)}>Subir</button>
                    <button type="button" className="underline" onClick={() => mover(indice, 1)}>Descer</button>
                    <button type="button" className="text-danger underline" onClick={() => removerArquivoImovel(imovelId, "fotos", foto.id)}>Excluir</button>
                  </>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        {somenteLeitura ? null : (
          <form className="mt-3 flex items-center gap-3" action={(formData) => enviar("fotos", formData)}>
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
            <Button type="submit" variant="outline">Enviar foto</Button>
          </form>
        )}
      </div>
      <div>
        <ul className="flex flex-col gap-2 text-sm">
          {documentos.map((documento) => (
            <li key={documento.id} className="flex flex-wrap items-center gap-3">
              <a className="underline" href={fileUrl(documento.url) ?? "#"} target="_blank" rel="noreferrer">
                {rotuloDe(categoriasDocumento, documento.categoria)} — {documento.nomeOriginal}
              </a>
              {somenteLeitura ? null : (
                <button type="button" className="text-danger underline" onClick={() => removerArquivoImovel(imovelId, "documentos", documento.id)}>Excluir</button>
              )}
            </li>
          ))}
        </ul>
        {somenteLeitura ? null : (
          <form className="mt-3 flex flex-wrap items-center gap-3" action={(formData) => enviar("documentos", formData)}>
            <select name="categoria" className="input input--primary h-10" defaultValue="MATRICULA">
              {categoriasDocumento.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
            <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
            <Button type="submit" variant="outline">Enviar documento</Button>
          </form>
        )}
      </div>
      {erro ? <p className="text-sm text-danger" role="alert">{erro}</p> : null}
    </section>
  );
}

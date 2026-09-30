"use client";

import { useState } from "react";
import { Link, Modal } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/ui/confirmar";
import { fileUrl } from "@/lib/files";
import { categoriasDocumentoContrato, rotuloDe } from "@/lib/labels";
import { enviarDocumentoContrato, removerDocumentoContrato } from "./actions";

type Documento = { id: string; url: string; nomeOriginal: string; categoria: string };

export function DocumentosContrato({
  contratoId,
  somenteLeitura,
  documentos,
}: {
  contratoId: string;
  somenteLeitura: boolean;
  documentos: Documento[];
}) {
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(formData: FormData) {
    setErro(null);
    const resultado = await enviarDocumentoContrato(contratoId, formData);
    if (resultado?.error) setErro(resultado.error);
  }

  return (
    <section className="flex max-w-3xl flex-col gap-3">
      <ul className="flex flex-col gap-2 text-sm">
        {documentos.map((documento) => (
          <li key={documento.id} className="flex flex-wrap items-center gap-3">
            <Link href={fileUrl(documento.url) ?? "#"} target="_blank">
              {rotuloDe(categoriasDocumentoContrato, documento.categoria)} · {documento.nomeOriginal}
            </Link>
            {somenteLeitura ? null : (
              <Confirmar
                rotulo="Excluir"
                titulo="Excluir documento?"
                confirmar="Excluir"
                aoConfirmar={() => removerDocumentoContrato(contratoId, documento.id)}
              />
            )}
          </li>
        ))}
      </ul>
      {somenteLeitura ? null : (
        <Modal>
          <Modal.Trigger className={buttonVariants({ variant: "outline" })}>Enviar</Modal.Trigger>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Documento</Modal.Heading>
                </Modal.Header>
                <form action={enviar}>
                  <Modal.Body className="flex flex-col gap-3">
                    <select name="categoria" className="input input--primary h-10" defaultValue="MINUTA">
                      {categoriasDocumentoContrato.map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>
                          {rotulo}
                        </option>
                      ))}
                    </select>
                    <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" type="submit">
                      Enviar
                    </Button>
                  </Modal.Footer>
                </form>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}
      {erro ? <p className="text-sm text-danger">{erro}</p> : null}
    </section>
  );
}

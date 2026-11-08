"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/ui/confirmar";
import { finalizarContrato, salvarDocumentoContrato } from "./actions";

export function EditorContrato({
  id,
  codigo,
  conteudoInicial,
  situacao,
  podeEscrever,
  avisoEmail,
}: {
  id: string;
  codigo: string;
  conteudoInicial: string;
  situacao: string;
  podeEscrever: boolean;
  avisoEmail?: string | null;
}) {
  const encerrado = situacao === "CANCELADO" || situacao === "ENCERRADO";
  const [editando, setEditando] = useState(podeEscrever && situacao === "MINUTA");
  const [revisando, setRevisando] = useState(false);
  const [html, setHtml] = useState(conteudoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const editor = useRef<HTMLDivElement>(null);

  function ligarEditor(elemento: HTMLDivElement | null) {
    if (!elemento || editor.current === elemento) return;
    editor.current = elemento;
    elemento.innerHTML = html;
  }

  function htmlAtual() {
    return editor.current?.innerHTML ?? html;
  }

  function comando(nome: string, valor?: string) {
    editor.current?.focus();
    document.execCommand(nome, false, valor);
  }

  function salvar() {
    const conteudo = htmlAtual();
    setHtml(conteudo);
    setErro(null);
    setSalvo(false);
    iniciar(async () => {
      const resposta = await salvarDocumentoContrato(id, conteudo, situacao !== "MINUTA");
      if (resposta && "error" in resposta) {
        setErro(resposta.error ?? "Não foi possível salvar o contrato.");
        return;
      }
      setSalvo(true);
    });
  }

  function abrirPdf() {
    const conteudo = htmlAtual();
    setHtml(conteudo);
    setErro(null);
    iniciar(async () => {
      if (editando) {
        const resposta = await salvarDocumentoContrato(id, conteudo, situacao !== "MINUTA");
        if (resposta && "error" in resposta) {
          setErro(resposta.error ?? "Não foi possível salvar o contrato.");
          return;
        }
      }
      window.open(`/contratos/${id}/pdf`, "_blank", "noopener");
    });
  }

  function finalizar() {
    setErro(null);
    iniciar(async () => {
      const conteudo = htmlAtual();
      const salvoAgora = await salvarDocumentoContrato(id, conteudo, false);
      if (salvoAgora && "error" in salvoAgora) {
        setErro(salvoAgora.error ?? "Não foi possível salvar o contrato.");
        return;
      }
      const resposta = await finalizarContrato(id);
      if (resposta && "error" in resposta) setErro(resposta.error ?? "Não foi possível finalizar o contrato.");
    });
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {podeEscrever && !editando && !encerrado ? (
          <Button type="button" variant="outline" onClick={() => setEditando(true)}>
            Editar contrato
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!revisando && editor.current) setHtml(editor.current.innerHTML);
            setRevisando((atual) => !atual);
          }}
        >
          {revisando ? "Voltar à edição" : "Revisar contrato"}
        </Button>
        {editando ? (
          <Button type="button" variant="outline" disabled={pendente} onClick={salvar}>
            Salvar alterações
          </Button>
        ) : null}
        <Button type="button" variant="outline" disabled={pendente} onClick={abrirPdf}>
          Visualizar PDF
        </Button>
        {podeEscrever && situacao === "MINUTA" ? (
          <Confirmar
            rotulo="Finalizar contrato"
            titulo={`Finalizar ${codigo}?`}
            confirmar="Finalizar"
            aoConfirmar={finalizar}
          />
        ) : null}
        {salvo ? <span className="text-sm text-muted">Alterações salvas.</span> : null}
      </div>
      {erro ? <p className="text-sm text-danger">{erro}</p> : null}
      {avisoEmail ? <p className="text-sm text-muted">{avisoEmail}</p> : null}
      {revisando ? (
        <article className="documento rounded-xl border border-border bg-white p-8 text-sm text-black" dangerouslySetInnerHTML={{ __html: html }} />
      ) : editando ? (
        <div className="overflow-hidden rounded-xl border border-border bg-white text-black">
          <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
            <Botao onMouseDown={() => comando("bold")}>Negrito</Botao>
            <Botao onMouseDown={() => comando("italic")}>Itálico</Botao>
            <Botao onMouseDown={() => comando("underline")}>Sublinhado</Botao>
            <Botao onMouseDown={() => comando("formatBlock", "H2")}>Título</Botao>
            <Botao onMouseDown={() => comando("formatBlock", "P")}>Parágrafo</Botao>
            <Botao onMouseDown={() => comando("insertUnorderedList")}>Lista</Botao>
          </div>
          <div
            ref={ligarEditor}
            className="documento min-h-96 p-8 text-sm outline-none"
            contentEditable
            suppressContentEditableWarning
            onInput={() => setHtml(htmlAtual())}
          />
        </div>
      ) : (
        <article className="documento rounded-xl border border-border bg-white p-8 text-sm text-black" dangerouslySetInnerHTML={{ __html: conteudoInicial }} />
      )}
    </div>
  );
}

function Botao({ children, onMouseDown }: { children: string; onMouseDown: () => void }) {
  return (
    <button
      type="button"
      className="rounded-md border border-border px-2 py-1 text-xs"
      onMouseDown={(evento) => {
        evento.preventDefault();
        onMouseDown();
      }}
    >
      {children}
    </button>
  );
}

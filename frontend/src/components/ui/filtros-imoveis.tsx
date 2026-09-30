"use client";

import { useState } from "react";
import { Checkbox, CheckboxGroup, Input, Label, Modal, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CampoNumero } from "@/components/ui/campo-numero";
import { finalidades, situacoes, tiposImovel } from "@/lib/labels";

function lista(valor: string | null) {
  return valor ? [valor] : [];
}

function Opcao({ value, children }: { value: string; children: string }) {
  return (
    <Checkbox value={value}>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>{children}</Checkbox.Content>
    </Checkbox>
  );
}

export function FiltrosImoveis() {
  const params = useSearchParams();
  const router = useRouter();
  const [tipo, setTipo] = useState(lista(params.get("tipo")));
  const [finalidade, setFinalidade] = useState(lista(params.get("finalidade")));
  const [situacao, setSituacao] = useState(lista(params.get("situacao")));
  const [cidade, setCidade] = useState(params.get("cidade") ?? "");
  const [bairro, setBairro] = useState(params.get("bairro") ?? "");
  const [precoMinimo, setPrecoMinimo] = useState<number | undefined>(numero(params.get("precoMinimo")));
  const [precoMaximo, setPrecoMaximo] = useState<number | undefined>(numero(params.get("precoMaximo")));
  const [areaMinima, setAreaMinima] = useState<number | undefined>(numero(params.get("areaMinima")));
  const [quartos, setQuartos] = useState<number | undefined>(numero(params.get("quartos")));
  const [vagas, setVagas] = useState<number | undefined>(numero(params.get("vagas")));

  function aplicar() {
    const consulta = new URLSearchParams();
    const busca = params.get("busca");
    if (busca) consulta.set("busca", busca);
    definir(consulta, "tipo", tipo.at(-1));
    definir(consulta, "finalidade", finalidade.at(-1));
    definir(consulta, "situacao", situacao.at(-1));
    if (cidade) consulta.set("cidade", cidade);
    if (bairro) consulta.set("bairro", bairro);
    definirNumero(consulta, "precoMinimo", precoMinimo);
    definirNumero(consulta, "precoMaximo", precoMaximo);
    definirNumero(consulta, "areaMinima", areaMinima);
    definirNumero(consulta, "quartos", quartos);
    definirNumero(consulta, "vagas", vagas);
    const texto = consulta.toString();
    router.push(texto ? `/imoveis?${texto}` : "/imoveis");
  }

  return (
    <Modal>
      <Modal.Trigger className={buttonVariants({ variant: "outline" })}>Filtros</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Filtros</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <TextField value={cidade} onChange={setCidade}>
                  <Label>Cidade</Label>
                  <Input />
                </TextField>
                <TextField value={bairro} onChange={setBairro}>
                  <Label>Bairro</Label>
                  <Input />
                </TextField>
              </div>
              <CheckboxGroup value={tipo} onChange={(valor) => setTipo(valor.slice(-1))}>
                <Label>Tipo</Label>
                <div className="flex flex-wrap gap-3">
                  {tiposImovel.map(([valor, rotulo]) => (
                    <Opcao key={valor} value={valor}>
                      {rotulo}
                    </Opcao>
                  ))}
                </div>
              </CheckboxGroup>
              <CheckboxGroup value={finalidade} onChange={(valor) => setFinalidade(valor.slice(-1))}>
                <Label>Finalidade</Label>
                <div className="flex flex-wrap gap-3">
                  {finalidades.map(([valor, rotulo]) => (
                    <Opcao key={valor} value={valor}>
                      {rotulo}
                    </Opcao>
                  ))}
                </div>
              </CheckboxGroup>
              <CheckboxGroup value={situacao} onChange={(valor) => setSituacao(valor.slice(-1))}>
                <Label>Situação</Label>
                <div className="flex flex-wrap gap-3">
                  {situacoes.map(([valor, rotulo]) => (
                    <Opcao key={valor} value={valor}>
                      {rotulo}
                    </Opcao>
                  ))}
                </div>
              </CheckboxGroup>
              <div className="grid gap-3 md:grid-cols-2">
                <CampoNumero rotulo="Preço mínimo" valor={precoMinimo} moeda aoMudar={setPrecoMinimo} />
                <CampoNumero rotulo="Preço máximo" valor={precoMaximo} moeda aoMudar={setPrecoMaximo} />
                <CampoNumero rotulo="Área mínima" valor={areaMinima} aoMudar={setAreaMinima} />
                <CampoNumero rotulo="Quartos" valor={quartos} aoMudar={setQuartos} />
                <CampoNumero rotulo="Vagas" valor={vagas} aoMudar={setVagas} />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                type="button"
                variant="tertiary"
                onClick={() => router.push("/imoveis")}
              >
                Limpar
              </Button>
              <Button slot="close" type="button" onClick={aplicar}>
                Aplicar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function numero(valor: string | null) {
  if (!valor) return undefined;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : undefined;
}

function definir(consulta: URLSearchParams, chave: string, valor?: string) {
  if (valor) consulta.set(chave, valor);
}

function definirNumero(consulta: URLSearchParams, chave: string, valor?: number) {
  if (valor != null && valor > 0) consulta.set(chave, String(valor));
}

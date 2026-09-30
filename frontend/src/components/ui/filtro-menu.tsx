"use client";

import { Dropdown } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FiltroMenu({
  nome,
  rotulo,
  opcoes,
}: {
  nome: string;
  rotulo: string;
  opcoes: readonly (readonly [string, string])[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const atual = params.get(nome);

  function aplicar(valor: string | null) {
    const consulta = new URLSearchParams(params.toString());
    consulta.delete("pagina");
    if (valor) consulta.set(nome, valor);
    else consulta.delete(nome);
    const texto = consulta.toString();
    router.push(texto ? `${pathname}?${texto}` : pathname);
  }

  const selecionado = opcoes.find(([valor]) => valor === atual)?.[1] ?? rotulo;

  return (
    <Dropdown>
      <Dropdown.Trigger className={buttonVariants({ variant: "outline" })}>{selecionado}</Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label={rotulo}
          onAction={(chave) => aplicar(chave === "todas" ? null : String(chave))}
        >
          <Dropdown.Item id="todas" textValue={rotulo}>
            {rotulo}
          </Dropdown.Item>
          {opcoes.map(([valor, nomeOpcao]) => (
            <Dropdown.Item key={valor} id={valor} textValue={nomeOpcao}>
              {nomeOpcao}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

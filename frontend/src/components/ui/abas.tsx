"use client";

import type { ReactNode } from "react";
import { Tabs } from "@heroui/react";

export function Abas({
  itens,
  selecionada,
}: {
  itens: { id: string; titulo: string; conteudo: ReactNode }[];
  selecionada?: string;
}) {
  return (
    <Tabs className="w-full" variant="secondary" defaultSelectedKey={selecionada ?? itens[0]?.id}>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Seções">
          {itens.map((item) => (
            <Tabs.Tab key={item.id} id={item.id}>
              {item.titulo}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {itens.map((item) => (
        <Tabs.Panel key={item.id} id={item.id} className="pt-4">
          {item.conteudo}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

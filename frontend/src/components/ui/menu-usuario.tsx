"use client";

import { useRef } from "react";
import { Dropdown } from "@heroui/react";
import { logoutAction } from "@/app/actions";

export function MenuUsuario({ nome }: { nome: string }) {
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger className="w-full justify-start rounded-xl px-2 py-2 text-left text-sm font-medium">
          {nome}
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label="Conta"
            onAction={() => {
              formulario.current?.requestSubmit();
            }}
          >
            <Dropdown.Item id="sair" textValue="Sair">
              Sair
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <form ref={formulario} action={logoutAction} />
    </>
  );
}

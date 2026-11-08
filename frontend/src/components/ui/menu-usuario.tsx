"use client";

import { useRef } from "react";
import { Dropdown } from "@heroui/react";
import { CircleUser, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

export function MenuUsuario({ nome }: { nome: string }) {
  const formulario = useRef<HTMLFormElement>(null);

  return (
    <>
      <Dropdown>
        <Dropdown.Trigger className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-medium">
          <CircleUser className="size-4 shrink-0" aria-hidden />
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
              <span className="flex items-center gap-2">
                <LogOut className="size-4" aria-hidden />
                Sair
              </span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <form ref={formulario} action={logoutAction} />
    </>
  );
}

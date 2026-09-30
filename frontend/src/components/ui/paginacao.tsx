"use client";

import { Pagination } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Paginacao({ total, tamanho = 20 }: { total: number; tamanho?: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const pagina = Math.max(1, Number(params.get("pagina") ?? "1") || 1);
  const paginas = Math.max(1, Math.ceil(total / tamanho));

  if (paginas <= 1) return null;

  function ir(proxima: number) {
    const consulta = new URLSearchParams(params.toString());
    consulta.set("pagina", String(proxima));
    router.push(`${pathname}?${consulta.toString()}`);
  }

  const visiveis = Array.from({ length: paginas }, (_, indice) => indice + 1).filter(
    (numero) => numero === 1 || numero === paginas || Math.abs(numero - pagina) <= 1,
  );

  return (
    <Pagination>
      <Pagination.Summary>
        {pagina} / {paginas}
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={pagina <= 1} onPress={() => ir(pagina - 1)}>
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {visiveis.map((numero, indice) => {
          const anterior = visiveis[indice - 1];
          return (
            <Pagination.Item key={numero}>
              {anterior != null && numero - anterior > 1 ? <Pagination.Ellipsis /> : null}
              <Pagination.Link isActive={numero === pagina} onPress={() => ir(numero)}>
                {numero}
              </Pagination.Link>
            </Pagination.Item>
          );
        })}
        <Pagination.Item>
          <Pagination.Next isDisabled={pagina >= paginas} onPress={() => ir(pagina + 1)}>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}

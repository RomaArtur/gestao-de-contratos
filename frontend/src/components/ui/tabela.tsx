import type { ReactNode } from "react";
import { ScrollShadow, Table } from "@heroui/react";

export function Tabela({
  rotulo,
  colunas,
  linhas,
}: {
  rotulo: string;
  colunas: string[];
  linhas: { id: string; celulas: ReactNode[] }[];
}) {
  return (
    <ScrollShadow className="max-h-[calc(100vh-11rem)] rounded-xl" orientation="vertical">
      <Table variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={rotulo}>
            <Table.Header>
              {colunas.map((coluna, index) => (
                <Table.Column key={coluna} isRowHeader={index === 0}>
                  {coluna}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {linhas.length === 0 ? (
                <Table.Row id="vazio">
                  {colunas.map((coluna) => (
                    <Table.Cell key={coluna}>{coluna === colunas[0] ? "—" : ""}</Table.Cell>
                  ))}
                </Table.Row>
              ) : (
                linhas.map((linha) => (
                  <Table.Row key={linha.id} id={linha.id}>
                    {linha.celulas.map((celula, index) => (
                      <Table.Cell key={`${linha.id}-${index}`}>{celula}</Table.Cell>
                    ))}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </ScrollShadow>
  );
}

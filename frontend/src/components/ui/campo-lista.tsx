"use client";

import { Autocomplete, FieldError, Label, ListBox, SearchField } from "@heroui/react";

export function CampoLista({
  rotulo,
  itens,
  valor,
  erro,
  desabilitado,
  aoMudar,
}: {
  rotulo: string;
  itens: { id: string; rotulo: string }[];
  valor?: string;
  erro?: string;
  desabilitado?: boolean;
  aoMudar: (valor: string) => void;
}) {
  return (
    <Autocomplete
      className="w-full"
      placeholder="Selecione"
      isDisabled={desabilitado}
      isInvalid={Boolean(erro)}
      selectedKey={valor || null}
      onSelectionChange={(chave) => aoMudar(chave ? String(chave) : "")}
    >
      <Label>{rotulo}</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter>
          <SearchField aria-label={rotulo} autoFocus>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Buscar" />
            </SearchField.Group>
          </SearchField>
        </Autocomplete.Filter>
        <ListBox>
          {itens.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.rotulo}>
              {item.rotulo}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Autocomplete.Popover>
      {erro ? <FieldError>{erro}</FieldError> : null}
    </Autocomplete>
  );
}

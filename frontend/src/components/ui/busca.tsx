import { SearchField } from "@heroui/react";

export function Busca({
  acao,
  valor,
  placeholder,
  extras,
}: {
  acao: string;
  valor?: string;
  placeholder: string;
  extras?: Record<string, string | undefined>;
}) {
  return (
    <form action={acao} className="min-w-72 flex-1">
      {extras
        ? Object.entries(extras).map(([chave, item]) =>
            item ? <input key={chave} type="hidden" name={chave} value={item} /> : null,
          )
        : null}
      <SearchField aria-label={placeholder} defaultValue={valor ?? ""} name="busca" variant="secondary">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input name="busca" placeholder={placeholder} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </form>
  );
}

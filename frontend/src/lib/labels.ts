export const tiposPessoa = [
  ["FISICA", "Pessoa física"],
  ["JURIDICA", "Pessoa jurídica"],
] as const;

export const tiposImovel = [
  ["CASA", "Casa"],
  ["APARTAMENTO", "Apartamento"],
  ["SALA_COMERCIAL", "Sala comercial"],
  ["LOJA", "Loja"],
  ["GALPAO", "Galpão"],
  ["TERRENO", "Terreno"],
  ["CHACARA", "Chácara"],
  ["OUTROS", "Outros"],
] as const;

export const finalidades = [
  ["VENDA", "Venda"],
  ["ALUGUEL", "Aluguel"],
  ["VENDA_ALUGUEL", "Venda e aluguel"],
] as const;

export const situacoes = [
  ["DISPONIVEL", "Disponível"],
  ["EM_NEGOCIACAO", "Em negociação"],
  ["RESERVADO", "Reservado"],
  ["ALUGADO", "Alugado"],
  ["VENDIDO", "Vendido"],
  ["INATIVO", "Inativo"],
] as const;

export const tiposCliente = [
  ["COMPRADOR", "Comprador"],
  ["LOCATARIO", "Locatário"],
  ["INVESTIDOR", "Investidor"],
  ["EMPRESA", "Empresa"],
  ["OUTROS", "Outros"],
] as const;

export const situacoesProposta = [
  ["RASCUNHO", "Rascunho"],
  ["ENVIADA", "Enviada"],
  ["ACEITA", "Aceita"],
  ["RECUSADA", "Recusada"],
  ["CANCELADA", "Cancelada"],
] as const;

export const situacoesContrato = [
  ["MINUTA", "Minuta"],
  ["VIGENTE", "Vigente"],
  ["ENCERRADO", "Encerrado"],
  ["CANCELADO", "Cancelado"],
] as const;

export const categoriasDocumentoContrato = [
  ["MINUTA", "Minuta"],
  ["ASSINADO", "Contrato assinado"],
  ["COMPROVANTE", "Comprovante"],
  ["OUTROS", "Outros"],
] as const;

export const categoriasDocumento = [
  ["MATRICULA", "Matrícula"],
  ["IPTU", "IPTU"],
  ["PLANTA", "Planta"],
  ["ESCRITURA", "Escritura"],
  ["CERTIDAO", "Certidão"],
  ["OUTROS", "Outros"],
] as const;

export function rotuloDe(opcoes: readonly (readonly [string, string])[], valor: string) {
  return opcoes.find(([chave]) => chave === valor)?.[1] ?? valor;
}

export function dinheiro(valor: number | null) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

import { formatDocument } from '../common/crypto/documents.js';
import { hojeIso } from '../comum/datas.js';
import type { Cliente, Imovel, Proprietario } from '../database/entidades-catalogo.js';
import type { Proposta } from '../database/entidades-proposta.js';

const TIPOS: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  SALA_COMERCIAL: 'Sala comercial',
  LOJA: 'Loja',
  GALPAO: 'Galpão',
  TERRENO: 'Terreno',
  CHACARA: 'Chácara',
  OUTROS: 'Outros',
};

type Endereco = {
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
};

export function montarValores(proposta: Proposta, documento: (cifrado: string) => string | null) {
  const imovel = proposta.imovel as Imovel;
  const proprietario = imovel.proprietario as Proprietario | undefined;
  const cliente = proposta.cliente as Cliente;
  const entrada = proposta.entrada == null ? null : Number(proposta.entrada);
  const parcelas = proposta.parcelas;
  const valor = Number(proposta.valor);
  const valorParcela =
    entrada != null && parcelas != null && parcelas > 0 && valor > entrada
      ? (valor - entrada) / parcelas
      : null;

  return {
    proprietario_nome: proprietario?.nome ?? null,
    proprietario_documento: documentoSeguro(proprietario?.documentoCifrado, documento),
    proprietario_email: proprietario?.email ?? null,
    proprietario_telefone: proprietario?.telefone ?? null,
    proprietario_endereco: proprietario ? endereco(proprietario) : null,
    cliente_nome: cliente.nome,
    cliente_documento: documentoSeguro(cliente.documentoCifrado, documento),
    cliente_email: cliente.email,
    cliente_telefone: cliente.telefone,
    cliente_endereco: endereco(cliente),
    cliente_id: cliente.id,
    imovel_codigo: imovel.codigo,
    imovel_tipo: TIPOS[imovel.tipo] ?? imovel.tipo,
    imovel_endereco: endereco(imovel),
    imovel_area: `${numero(Number(imovel.area))} m²`,
    imovel_descricao: imovel.descricao,
    finalidade: proposta.finalidade === 'ALUGUEL' ? 'Aluguel' : 'Venda',
    valor: dinheiro(valor),
    forma_pagamento: proposta.formaPagamento?.nome ?? null,
    entrada: entrada == null ? null : dinheiro(entrada),
    parcelas: parcelas == null ? null : String(parcelas),
    valor_parcela: valorParcela == null ? null : dinheiro(valorParcela),
    condicoes: proposta.condicoes,
    validade: proposta.validade ? dataBr(proposta.validade) : null,
    data_negociacao: dataBr(hojeIso()),
  };
}

export function pendenciasObrigatorias(valores: Record<string, string | null>) {
  const campos: Array<[string, string]> = [
    ['proprietario_nome', 'proprietário'],
    ['cliente_nome', 'cliente'],
    ['imovel_codigo', 'imóvel'],
    ['valor', 'valor negociado'],
    ['forma_pagamento', 'forma de pagamento'],
  ];
  return campos.filter(([chave]) => !valores[chave]?.trim()).map(([, rotulo]) => rotulo);
}

function documentoSeguro(cifrado: string | undefined, documento: (cifrado: string) => string | null) {
  if (!cifrado) return null;
  const digitos = documento(cifrado);
  return digitos ? formatDocument(digitos) : null;
}

function endereco(origem: Endereco) {
  const linha = [origem.logradouro, origem.numero, origem.complemento].filter(Boolean).join(', ');
  return `${linha} — ${origem.bairro}, ${origem.cidade}/${origem.uf}, CEP ${origem.cep}`;
}

function dinheiro(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function numero(valor: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor);
}

function dataBr(iso: string) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

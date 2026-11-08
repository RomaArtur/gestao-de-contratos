import { describe, expect, it } from 'vitest';
import { montarValores, pendenciasObrigatorias } from './dados-contrato.js';
import type { Proposta } from '../database/entidades-proposta.js';

function proposta(parcial: Record<string, unknown> = {}) {
  return {
    finalidade: 'VENDA',
    valor: '420000',
    entrada: null,
    parcelas: null,
    condicoes: null,
    validade: null,
    formaPagamento: { nome: 'PIX' },
    imovel: {
      codigo: 'IMV-001',
      tipo: 'APARTAMENTO',
      area: '80',
      descricao: null,
      logradouro: 'Rua A',
      numero: '10',
      complemento: null,
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01001000',
      proprietario: {
        nome: 'RRRRRR',
        documentoCifrado: 'cifra',
        email: 'dono@imobiliaria.local',
        telefone: '11999998888',
        logradouro: 'Rua B',
        numero: '2',
        complemento: null,
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01001000',
      },
    },
    cliente: {
      id: 'cliente-1',
      nome: 'João Pereira',
      documentoCifrado: 'cifra',
      email: 'joao@imobiliaria.local',
      telefone: '11988887777',
      logradouro: 'Rua C',
      numero: '3',
      complemento: null,
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01001000',
    },
    ...parcial,
  } as unknown as Proposta;
}

describe('montarValores', () => {
  it('preenche o que existe e deixa entrada e parcelas de fora', () => {
    const valores = montarValores(proposta(), () => '12345678901');
    expect(valores.cliente_nome).toBe('João Pereira');
    expect(valores.proprietario_documento).toBe('123.456.789-01');
    expect(valores.entrada).toBeNull();
    expect(valores.parcelas).toBeNull();
    expect(valores.valor_parcela).toBeNull();
    expect(pendenciasObrigatorias(valores)).toEqual([]);
  });

  it('calcula a parcela só quando entrada e quantidade existem', () => {
    const valores = montarValores(proposta({ entrada: '20000', parcelas: 10 }), () => null);
    expect(valores.valor_parcela?.replace(/\s/g, '')).toBe('R$40.000,00');
    expect(valores.proprietario_documento).toBeNull();
  });

  it('aponta os dados obrigatórios ausentes', () => {
    const valores = montarValores(proposta({ formaPagamento: null }), () => null);
    expect(pendenciasObrigatorias(valores)).toContain('forma de pagamento');
  });
});

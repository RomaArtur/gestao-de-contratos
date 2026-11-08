import { describe, expect, it } from 'vitest';
import { htmlModelo, preencherModelo } from './modelos-texto.js';

describe('preencherModelo', () => {
  it('troca as variáveis disponíveis e deixa em branco as que não existem', () => {
    const html = preencherModelo(htmlModelo('PIX'), {
      cliente_nome: 'João <Pereira>',
      valor: 'R$ 420.000,00',
      forma_pagamento: 'PIX',
    });

    expect(html).toContain('João &lt;Pereira&gt;');
    expect(html).toContain('R$ 420.000,00');
    expect(html).toContain('PIX');
    expect(html).toContain('Entrada: ____________');
    expect(html).not.toContain('{{entrada}}');
    expect(html).not.toContain('<Pereira>');
  });

  it('usa as cláusulas da forma de pagamento', () => {
    expect(htmlModelo('Financiamento')).toContain('aprovação do crédito');
    expect(htmlModelo('Boleto')).toContain('boletos');
    expect(htmlModelo('Cheque especial')).toContain('Cheque especial');
  });
});

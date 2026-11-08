import { describe, expect, it } from 'vitest';
import { sanearHtml, textoVisivel } from './sanear-html.js';

describe('sanearHtml', () => {
  it('remove script e atributos e conserva o texto editado', () => {
    const html = sanearHtml('<h1 onclick="alert(1)">Contrato</h1><script>alert(1)</script><p>Valor <strong>R$ 10</strong></p>');
    expect(html).toBe('<h1>Contrato</h1><p>Valor <strong>R$ 10</strong></p>');
    expect(textoVisivel(html)).toBe('Contrato Valor R$ 10');
  });
});

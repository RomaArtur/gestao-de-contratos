import { randomBytes } from 'node:crypto';
import {
  decryptField,
  documentLookup,
  encryptField,
  maskDocument,
} from './field-cipher.js';
import { isValidCnpj, isValidCpf } from './documents.js';

describe('criptografia de documentos', () => {
  const key = randomBytes(32);

  it('recupera o CPF depois de criptografar', () => {
    const payload = encryptField('52998224725', key);
    expect(payload).not.toContain('52998224725');
    expect(decryptField(payload, key)).toBe('52998224725');
  });

  it('mascara o documento e gera a mesma busca para o mesmo número', () => {
    expect(maskDocument('52998224725')).toBe('*******4725');
    expect(documentLookup('52998224725')).toBe(documentLookup('52998224725'));
  });

  it('valida CPF e CNPJ', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true);
    expect(isValidCnpj('11.444.777/0001-60')).toBe(false);
  });
});

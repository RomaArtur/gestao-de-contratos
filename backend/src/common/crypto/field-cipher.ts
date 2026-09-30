import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

export function encryptField(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptField(payload: string, key: Buffer): string {
  const [iv, tag, encrypted] = payload.split('.');
  if (!iv || !tag || !encrypted) {
    throw new Error('Campo criptografado inválido.');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function documentLookup(digits: string): string {
  return createHash('sha256').update(digits).digest('hex');
}

export function maskDocument(digits: string): string {
  if (digits.length <= 4) {
    return digits;
  }
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

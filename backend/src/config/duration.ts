export function ttlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    throw new Error(`TTL inválido: ${ttl}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return amount * factor;
}

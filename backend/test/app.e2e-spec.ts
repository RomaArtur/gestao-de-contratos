import { ttlToSeconds } from '../src/config/duration.js';

describe('duration', () => {
  it('converte a validade do access token em segundos', () => {
    expect(ttlToSeconds('15m')).toBe(900);
  });
});

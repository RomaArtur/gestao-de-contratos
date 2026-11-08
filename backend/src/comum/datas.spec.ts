import { limitesVigencia, somarDias } from './datas.js';

describe('datas de vigência', () => {
  it('avança o mês e o ano sem deslocar o dia', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-11-06', 30)).toBe('2026-12-06');
    expect(somarDias('2026-12-15', 30)).toBe('2027-01-14');
  });

  it('marca o limite dos contratos próximos em 30 dias', () => {
    expect(limitesVigencia('2026-11-06')).toEqual({
      hoje: '2026-11-06',
      limite: '2026-12-06',
    });
  });
});

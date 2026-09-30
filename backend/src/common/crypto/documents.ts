export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }
  const check = (length: number) => {
    let total = 0;
    for (let index = 0; index < length; index += 1) {
      total += Number(digits[index]) * (length + 1 - index);
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }
  const calc = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const total = weights.reduce(
      (sum, weight, index) => sum + Number(digits[index]) * weight,
      0,
    );
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

export function formatDocument(digits: string): string {
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }
  return digits;
}

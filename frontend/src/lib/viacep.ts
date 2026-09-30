export type EnderecoViaCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export async function consultarCep(cep: string): Promise<EnderecoViaCep | null> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
  if (!response.ok) return null;
  const dados = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (dados.erro) return null;
  return {
    logradouro: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    uf: dados.uf || "",
  };
}

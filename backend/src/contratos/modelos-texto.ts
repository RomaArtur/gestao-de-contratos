const VAZIO = '____________';

const CLAUSULAS: Record<string, string> = {
  'à vista':
    '<p>O preço será pago à vista, em parcela única, na data da assinatura, pelo meio ajustado entre as partes. A quitação depende da compensação integral do valor.</p>',
  pix:
    '<p>O preço será pago por PIX. A chave e o comprovante serão informados no ato do pagamento, e o comprovante passa a integrar este contrato.</p>',
  boleto:
    '<p>O preço será pago por boletos. Cada boleto vencido e não pago sujeita o devedor aos encargos previstos na lei e nas condições abaixo.</p>',
  transferência:
    '<p>O preço será pago por transferência bancária à conta do proprietário. Os dados bancários que não constarem deste instrumento serão informados por escrito. O comprovante quita a parcela correspondente.</p>',
  financiamento:
    '<p>Parte do preço pode ser paga como entrada e o saldo financiado. A conclusão fica condicionada à aprovação do crédito. Entrada, parcelas e saldo só valem quando estiverem preenchidos neste instrumento.</p>',
  cartão:
    '<p>O preço será pago por cartão. A aprovação da operadora é condição do pagamento. Parcelas e encargos da operação só obrigam as partes quando estiverem preenchidos neste instrumento.</p>',
};

export function clausulasDaForma(nome: string) {
  return (
    CLAUSULAS[nome.trim().toLocaleLowerCase('pt-BR')] ??
    '<p>O pagamento segue a modalidade {{forma_pagamento}}. Condições específicas que não constem do cadastro devem ser completadas neste instrumento antes da finalização.</p>'
  );
}

export function htmlModelo(forma: string) {
  return `<h1>Contrato — ${forma}</h1>
<p>Pelo presente instrumento, as partes abaixo identificadas contratam a negociação do imóvel descrito, nas condições que efetivamente constarem deste documento.</p>
<h2>Proprietário</h2>
<p>Nome: {{proprietario_nome}}</p>
<p>Documento: {{proprietario_documento}}</p>
<p>E-mail: {{proprietario_email}}</p>
<p>Telefone: {{proprietario_telefone}}</p>
<p>Endereço: {{proprietario_endereco}}</p>
<h2>Cliente</h2>
<p>Nome: {{cliente_nome}}</p>
<p>Documento: {{cliente_documento}}</p>
<p>E-mail: {{cliente_email}}</p>
<p>Telefone: {{cliente_telefone}}</p>
<p>Endereço: {{cliente_endereco}}</p>
<p>ID do contato: {{cliente_id}}</p>
<h2>Imóvel</h2>
<p>Código: {{imovel_codigo}}</p>
<p>Tipo: {{imovel_tipo}}</p>
<p>Endereço: {{imovel_endereco}}</p>
<p>Área: {{imovel_area}}</p>
<p>Descrição: {{imovel_descricao}}</p>
<h2>Negociação</h2>
<p>Finalidade: {{finalidade}}</p>
<p>Valor negociado: {{valor}}</p>
<p>Forma de pagamento: {{forma_pagamento}}</p>
<p>Entrada: {{entrada}}</p>
<p>Parcelas: {{parcelas}}</p>
<p>Valor da parcela: {{valor_parcela}}</p>
<p>Validade da proposta: {{validade}}</p>
<p>Data da negociação: {{data_negociacao}}</p>
<h2>Condições da forma de pagamento</h2>
${clausulasDaForma(forma)}
<h2>Demais condições</h2>
<p>{{condicoes}}</p>
<h2>Assinaturas</h2>
<p>Proprietário: {{proprietario_nome}}</p>
<p>Cliente: {{cliente_nome}}</p>`;
}

export function preencherModelo(html: string, valores: Record<string, string | null | undefined>) {
  return html.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_marca, chave: string) => {
    const valor = valores[chave];
    if (valor == null || valor.trim() === '') return VAZIO;
    return escapar(valor.trim());
  });
}

function escapar(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const PERMITIDAS = new Set([
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'span',
  'div',
  'blockquote',
]);

export function sanearHtml(html: string) {
  const semScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  return semScripts.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (marca, etiqueta: string) => {
    const nome = etiqueta.toLowerCase();
    if (!PERMITIDAS.has(nome)) return '';
    if (marca.startsWith('</')) return `</${nome}>`;
    if (nome === 'br') return '<br>';
    return `<${nome}>`;
  });
}

export function textoVisivel(html: string) {
  return sanearHtml(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

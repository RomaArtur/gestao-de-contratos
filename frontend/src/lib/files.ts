export function fileUrl(path: string | null) {
  if (!path) return null;
  const nome = path.split("/").pop();
  if (!nome) return null;
  return `/api/arquivos/${encodeURIComponent(nome)}`;
}

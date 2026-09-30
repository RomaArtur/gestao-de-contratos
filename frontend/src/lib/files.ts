export function fileUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

import { redirect } from "next/navigation";

export default function PaginaDocumentacao() {
  const api = process.env.PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:3001";
  redirect(`${api}/api/docs`);
}

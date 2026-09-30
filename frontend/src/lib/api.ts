import { auth } from "@/auth";
import { redirect } from "next/navigation";

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await auth();
  const headers = new Headers(init?.headers);
  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${process.env.API_URL}/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (!response.ok) {
    const message = body?.message;
    throw new ApiError(
      Array.isArray(message) ? message.join(" ") : message || "Não foi possível concluir a operação.",
    );
  }
  return body as T;
}

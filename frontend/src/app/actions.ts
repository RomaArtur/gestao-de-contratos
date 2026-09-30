"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import { decode } from "next-auth/jwt";
import { signIn, signOut } from "@/auth";

const SESSION_COOKIE = "authjs.session-token";

export async function loginAction(values: { email: string; password: string }) {
  try {
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}

export async function logoutAction() {
  const secret = process.env.AUTH_SECRET;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (secret && token) {
    const decoded = await decode({ token, secret, salt: SESSION_COOKIE });
    const refreshToken = decoded?.refreshToken;
    if (typeof refreshToken === "string") {
      await fetch(`${process.env.API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }
  }
  await signOut({ redirectTo: "/login" });
}

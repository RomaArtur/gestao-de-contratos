import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { MenuUsuario } from "@/components/ui/menu-usuario";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="bg-black px-3 py-4">
          <img src="/logo-sacramento.png" alt="Sacramento Corretor de Imóveis" className="h-12 w-full object-contain" />
        </div>
        <AppNav />
        <div className="border-t border-border p-3">
          <MenuUsuario nome={session.user.name ?? "Conta"} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

import { Card } from "@heroui/react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="pagina items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <Card.Header className="bg-black">
          <img src="/logo-sacramento.png" alt="Sacramento Corretor de Imóveis" className="h-12 w-full object-contain" />
        </Card.Header>
        <Card.Content>
          <LoginForm />
        </Card.Content>
      </Card>
    </main>
  );
}

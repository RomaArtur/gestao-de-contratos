import { Card } from "@heroui/react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>Gestão</Card.Title>
        </Card.Header>
        <Card.Content>
          <LoginForm />
        </Card.Content>
      </Card>
    </main>
  );
}

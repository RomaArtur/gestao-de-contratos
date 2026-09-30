"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Indicador } from "@/components/ui/indicador";
import { FieldError, Input, Label, TextField } from "@heroui/react";
import { loginAction } from "@/app/actions";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    const result = await loginAction(values);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <TextField isInvalid={Boolean(errors.email)} name="email" type="email" fullWidth>
        <Label>E-mail</Label>
        <Input autoComplete="email" {...register("email")} />
        {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
      </TextField>
      <TextField isInvalid={Boolean(errors.password)} name="password" type="password" fullWidth>
        <Label>Senha</Label>
        <Input autoComplete="current-password" {...register("password")} />
        {errors.password ? <FieldError>{errors.password.message}</FieldError> : null}
      </TextField>
      {serverError ? (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" fullWidth isDisabled={isSubmitting}>
        {isSubmitting ? <Indicador rotulo="Entrando" indeterminado /> : "Entrar"}
      </Button>
    </form>
  );
}

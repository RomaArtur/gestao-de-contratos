"use client";

import type { ReactNode } from "react";
import { FieldError, Label, TextField } from "@heroui/react";

export const controlClass = "input input--primary w-full";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <TextField className="w-full" fullWidth isInvalid={Boolean(error)}>
      <Label>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

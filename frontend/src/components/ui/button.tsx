"use client";

import { Button as HeroButton, type ButtonProps } from "@heroui/react";

const variants = {
  default: "primary",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "danger",
  link: "ghost",
  primary: "primary",
  tertiary: "tertiary",
  danger: "danger",
} as const;

type Variante = keyof typeof variants;

export function Button({
  variant = "primary",
  disabled,
  size,
  onClick,
  className,
  children,
  ...props
}: Omit<ButtonProps, "variant" | "size" | "onPress"> & {
  variant?: Variante | ButtonProps["variant"];
  disabled?: boolean;
  size?: "default" | "lg" | "sm" | "md" | "xs" | "icon";
  onClick?: () => void;
}) {
  const nome = variants[variant as Variante] ?? variant;
  const tamanho = size === "lg" ? "lg" : size === "sm" || size === "xs" ? "sm" : "md";

  return (
    <HeroButton
      variant={nome}
      size={tamanho}
      className={className}
      {...(disabled ? { isDisabled: true } : {})}
      {...(onClick ? { onPress: () => onClick() } : {})}
      {...props}
    >
      {children}
    </HeroButton>
  );
}

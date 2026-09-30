"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";

export function Provedor({ children }: { children: ReactNode }) {
  return <I18nProvider locale="pt-BR">{children}</I18nProvider>;
}

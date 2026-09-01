import type { ReactNode } from "react";

/**
 * <html> und <body> werden in src/app/[locale]/layout.tsx gerendert, damit das
 * lang-Attribut zur Locale passt. Dieses Root-Layout reicht deshalb nur durch -
 * würde es selbst html/body rendern, entstünden zwei verschachtelte Dokumente
 * und React bricht die Hydration ab.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

"use client";

/**
 * Gemeinsame Bausteine des Admin-Cockpits unter /controls.
 *
 * Die Steuerung wird am Rechner bedient, aber gelegentlich auch am Handy. Alle
 * Bausteine sind deshalb von Haus aus einspaltig und ordnen sich erst auf
 * breiten Anzeigen nebeneinander - so bleibt eine Reihenfolge bestehen, die auf
 * beiden Geräten Sinn ergibt.
 */

import type { ReactNode } from "react";

export const BUTTON =
  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export const ACTIVE = "bg-white text-neutral-900 shadow-lg shadow-black/40";

export const INACTIVE =
  "bg-white/[0.07] text-white/90 ring-1 ring-inset ring-white/10 hover:bg-white/[0.14] hover:text-white";

/** Kleiner, unaufdringlicher Knopf für Nebenwege wie "Automatik übernehmen lassen". */
export const QUIET =
  "rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-40";

interface PanelProps {
  title: string;
  /** Rechts in der Kopfzeile, für Zähler oder Zustände. */
  meta?: ReactNode;
  /** Für Rasterangaben wie xl:col-span-2. */
  className?: string;
  children: ReactNode;
}

export function Panel({ title, meta, className, children }: PanelProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-4 sm:p-5 ${className ?? ""}`}
    >
      {/* Lichtkante oben - gibt den Flächen Tiefe, ohne Rahmen zu verstärken. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
          {title}
        </h2>
        {meta && <span className="shrink-0 text-xs tabular-nums text-white/35">{meta}</span>}
      </div>

      {children}
    </section>
  );
}

/** Zustandsanzeige in der Kopfzeile: Punkt plus Text. */
export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "ok" | "warn" | "neutral";
  children: ReactNode;
}) {
  const dot =
    tone === "ok" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-white/40";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

/** Trennlinie mit Beschriftung, für Nebenbereiche innerhalb einer Fläche. */
export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">
        {label}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/cn";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Hospeda Link - início">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
          <path d="M10 22V10h4.6c2.8 0 4.6 1.6 4.6 3.9 0 1.7-.9 3-2.5 3.5L20 22h-3.4l-2.9-4.2H12.9V22H10z" fill="#fff" />
          <circle cx="23.5" cy="8.5" r="1.7" fill="#1F7A5C" />
        </svg>
      </span>
      <span className={cn("text-[17px] font-semibold tracking-tight", dark ? "text-white" : "text-ink")}>
        Hospeda <span className="text-accent">Link</span>
      </span>
    </Link>
  );
}

const NAV = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Para empresas", href: "/#para-empresas" },
  { label: "Parceiros", href: "/#para-parceiros" },
  { label: "Contato", href: "/#contato" },
];

export function Header({ overlay = false }: { overlay?: boolean }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  const solid = !overlay || scrolled;
  const onDark = !solid;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        solid ? "bg-white/95 backdrop-blur border-b border-border" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo dark={onDark} />

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                solid ? "text-muted hover:text-brand" : "text-white/80 hover:text-white",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            to="/solicitar-hospedagem"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Solicitar hospedagem
          </Link>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
          onClick={() => setOpen((v) => !v)}
           aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className={solid ? "text-ink" : "text-white"}>
            {open ? (
              <path d="M5 5l12 12M17 5 5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/solicitar-hospedagem"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white"
            >
              Solicitar hospedagem
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

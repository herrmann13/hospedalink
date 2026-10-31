import { useEffect } from "react";
import { LinkButton } from "@/components/ui/Button";

export function NotFound() {
  useEffect(() => {
    document.title = "Página não encontrada — Hospeda Link";
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32">
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Esta página não existe
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        O endereço pode ter mudado ou sido digitado incorretamente. Volte ao início ou
        consulte os parceiros disponíveis para hospedar sua equipe em Jataí.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton to="/">Ir para o início</LinkButton>
        <LinkButton to="/parceiros" variant="secondary">
          Ver parceiros
        </LinkButton>
      </div>
    </div>
  );
}

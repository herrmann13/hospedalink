import { Link } from "react-router-dom";
import { Reveal } from "@/components/ui/Reveal";

export function CtaFinal() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <div className="relative overflow-hidden bg-brand px-8 py-14 text-center text-white sm:px-14">
          <div>
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Você cuida do seu projeto. Nós cuidamos da hospedagem da sua equipe.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/solicitar-hospedagem"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-7 text-base font-semibold text-white transition-colors hover:bg-accent-strong"
              >
                Solicitar hospedagem
              </Link>
              <Link
                to="/seja-parceiro"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                Quero ser parceiro
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

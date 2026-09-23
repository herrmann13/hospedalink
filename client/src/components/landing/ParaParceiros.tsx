import { Link } from "react-router-dom";
import { Reveal } from "@/components/ui/Reveal";

const partnerBenefits = [
  "Novas oportunidades comerciais",
  "Ocupação de vagas disponíveis",
  "Acesso a clientes corporativos",
  "Estadias de vários dias",
  "Negociação centralizada",
  "Relacionamento recorrente",
];

export function ParaParceiros() {
  return (
    <section id="para-parceiros" className="bg-brand-strong text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
              <img
                src="https://picsum.photos/seed/hospeda-pousada/1000/750"
                alt="Pousada parceira pronta para receber equipes"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-strong/50 to-transparent" />
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tem um hotel, pousada ou alojamento em Jataí?
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {partnerBenefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link
                to="/seja-parceiro"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-7 text-base font-semibold text-white transition-colors hover:bg-accent-strong"
              >
                Quero ser parceiro
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

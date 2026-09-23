import { Reveal, SectionHeading } from "@/components/ui/Reveal";

const steps = [
  {
    n: "01",
    title: "Conte sua necessidade",
    text: "A empresa informa a quantidade de colaboradores, período, localização de trabalho e requisitos da hospedagem.",
  },
  {
    n: "02",
    title: "Buscamos opções",
    text: "Consultamos nossa rede de hotéis, pousadas e alojamentos parceiros em Jataí.",
  },
  {
    n: "03",
    title: "Negociamos por você",
    text: "Analisamos disponibilidade, preços e condições comerciais para encontrar opções adequadas ao perfil da equipe.",
  },
  {
    n: "04",
    title: "Apresentamos a solução",
    text: "Entramos em contato com sua empresa e apresentamos as opções selecionadas para fechamento.",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <SectionHeading
          title="Como funciona"
        />
      </Reveal>

      <div className="mt-14 grid grid-cols-1 border-t border-border sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.08} className="border-b border-border bg-white sm:even:border-l sm:even:pl-7 lg:border-l lg:pl-7 lg:pr-7 lg:first:border-l-0 lg:first:pl-0">
            <div className="flex h-full flex-col py-7 lg:min-h-[230px]">
              <span className="font-mono text-sm text-accent">{step.n}</span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

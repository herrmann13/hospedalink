import { ArrowDown, BuildingOffice, MagnifyingGlass, CheckCircle } from "@phosphor-icons/react";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";

const flow = [
  {
    icon: BuildingOffice,
    text: "“Preciso hospedar 15 colaboradores durante 20 dias, com estacionamento e café da manhã.”",
    tone: "text-brand",
  },
  {
    icon: MagnifyingGlass,
    text: "Nossa equipe consulta os parceiros disponíveis.",
    tone: "text-accent",
  },
  {
    icon: CheckCircle,
    text: "Apresentamos opções compatíveis com a necessidade.",
    tone: "text-accent",
  },
];

export function Diferenciacao() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <SectionHeading
            align="center"
            title="Mais do que uma lista de hotéis."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-2xl border-y border-border bg-white py-8 sm:py-10">
            {flow.map((step, i) => (
              <div key={i}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                    <step.icon size={22} weight="regular" />
                  </span>
                  <p className="pt-2 text-base leading-relaxed text-ink">{step.text}</p>
                </div>
                {i < flow.length - 1 && (
                  <div className="my-4 ml-[21px] flex items-center gap-2 text-muted">
                    <span className="h-6 w-px bg-border" />
                    <ArrowDown size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

      </div>
    </section>
  );
}

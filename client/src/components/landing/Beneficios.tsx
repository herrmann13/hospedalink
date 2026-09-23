import { Clock, Handshake, MapPin, Stack, UserFocus } from "@phosphor-icons/react";
import { Reveal, SectionHeading } from "@/components/ui/Reveal";

const benefits = [
  {
    icon: Clock,
    title: "Economia de tempo",
    text: "Evite ligar para diversos hotéis e alojamentos procurando disponibilidade.",
  },
  {
    icon: UserFocus,
    title: "Atendimento personalizado",
    text: "Cada solicitação é analisada individualmente conforme o perfil da equipe.",
  },
  {
    icon: Handshake,
    title: "Negociação comercial",
    text: "Buscamos condições adequadas para grupos e estadias corporativas.",
  },
  {
    icon: MapPin,
    title: "Rede local",
    text: "Trabalhamos com estabelecimentos de Jataí preparados para receber equipes.",
  },
  {
    icon: Stack,
    title: "Centralização",
    text: "Um único contato para organizar a hospedagem de toda a equipe.",
  },
];

export function Beneficios() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <SectionHeading
            title="Por que usar nosso serviço"
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.05}>
              <BenefitRow benefit={b} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitRow({ benefit }: { benefit: (typeof benefits)[number] }) {
  const Icon = benefit.icon;
  return (
    <div className="flex gap-4 border-t border-border py-6">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-brand">
        <Icon size={21} weight="regular" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-ink">{benefit.title}</h3>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { CheckCircle, MapPin, UsersThree, CalendarBlank } from "@phosphor-icons/react";
import { Reveal } from "@/components/ui/Reveal";

const demands = [
  "5 colaboradores por 10 dias",
  "12 colaboradores durante uma obra",
  "20 colaboradores por 30 dias",
  "Equipe com necessidade de estacionamento",
  "Hospedagem com café da manhã",
  "Hospedagem com lavanderia",
];

export function ParaEmpresas() {
  return (
    <section id="para-empresas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Sua equipe precisa ficar em Jataí? Nós encontramos onde.
          </h2>
          <div className="mt-8">
            <Link
              to="/solicitar-hospedagem"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-7 text-base font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Solicitar cotação
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-y border-border">
            <div className="flex items-center justify-between py-5">
              <div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                  Construtora Horizonte
                </h3>
              </div>
              <span className="text-sm font-medium text-accent">Atendimento manual</span>
            </div>

            <div className="grid grid-cols-1 border-t border-border sm:grid-cols-3">
              <Info icon={UsersThree} label="Equipe" value="12 colaboradores" />
              <Info icon={CalendarBlank} label="Período" value="20 dias" />
              <Info icon={MapPin} label="Projeto" value="BR-364" />
            </div>

            <div className="border-t border-border py-5">
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {demands.slice(3).map((d) => (
                  <span key={d} className="flex items-center gap-2 text-sm text-ink">
                    <CheckCircle size={16} weight="fill" className="text-accent" />
                    {d.replace("Equipe com necessidade de ", "").replace("Hospedagem com ", "")}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersThree;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-4 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
      <Icon size={19} className="shrink-0 text-brand" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

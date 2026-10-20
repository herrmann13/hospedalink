import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-32">
        <div>
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]"
          >
            Quando o trabalho chega em Jataí, a hospedagem precisa estar pronta.
          </motion.h1>

          <motion.div
            custom={1}
            variants={fadeUp}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/solicitar-hospedagem"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-7 text-base font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              Solicitar hospedagem
            </Link>
            <Link
              to="/parceiros"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Ver parceiros
            </Link>
          </motion.div>

        </div>

        <motion.div
          custom={2}
          variants={fadeUp}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="relative lg:pt-8"
        >
          <div className="border border-white/15 bg-white p-6 text-ink shadow-card sm:p-8">
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Equipe de manutenção</h2>
                <p className="mt-1 text-xs text-muted">Exemplo ilustrativo de solicitação</p>
              </div>
              <span className="font-mono text-xs text-accent">JATAÍ-GO</span>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6">
              <div>
                <dt className="text-xs text-muted">Equipe</dt>
                <dd className="mt-1 text-base font-semibold">12 pessoas</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Período</dt>
                <dd className="mt-1 text-base font-semibold">20 dias</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Acomodação</dt>
                <dd className="mt-1 text-base font-semibold">Quarto duplo</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Local de trabalho</dt>
                <dd className="mt-1 text-base font-semibold">BR-364</dd>
              </div>
            </dl>

            <div className="border-t border-border pt-5">
              <p className="text-sm leading-relaxed text-ink">
                Café da manhã, lavanderia e estacionamento.
              </p>
            </div>

            <div className="mt-6 border-l-2 border-accent pl-3">
              <p className="text-sm font-medium text-ink">Consulta aos parceiros locais</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

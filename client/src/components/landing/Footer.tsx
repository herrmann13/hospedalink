import { Link } from "react-router-dom";
import { Logo } from "./Header";

const columns = [
  {
    title: "Navegação",
    links: [
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Para empresas", href: "/#para-empresas" },
      { label: "Parceiros", href: "/parceiros" },
    ],
  },
  {
    title: "Para você",
    links: [
      { label: "Solicitar hospedagem", href: "/solicitar-hospedagem" },
      { label: "Ver parceiros", href: "/parceiros" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Termos de Uso", href: "/termos" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contato" className="bg-brand-strong text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo dark />
            <p className="mt-4 text-sm text-white/80">Precisa hospedar sua equipe? Envie uma solicitação e retornaremos pelo contato informado.</p>
            <Link to="/solicitar-hospedagem" className="mt-3 inline-block text-sm text-white underline">Falar com a Hospeda Link</Link>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            Jataí, Goiás. Atendimento a empresas de todo o Brasil.
          </p>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Hospeda Link. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

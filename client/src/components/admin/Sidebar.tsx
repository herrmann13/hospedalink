import { NavLink, Link } from "react-router-dom";
import {
  SquaresFour,
  ClipboardText,
  Buildings,
  ArrowsLeftRight,
  FileText,
  GearSix,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const items = [
  { to: "/admin", label: "Dashboard", icon: SquaresFour, end: true },
  { to: "/admin/solicitacoes", label: "Solicitações", icon: ClipboardText },
  { to: "/admin/parceiros", label: "Parceiros", icon: Buildings },
  { to: "/admin/negociacoes", label: "Negociações", icon: ArrowsLeftRight },
  { to: "/admin/contratos", label: "Contratos", icon: FileText },
  { to: "/admin/configuracoes", label: "Configurações", icon: GearSix },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5" onClick={onNavigate}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M10 22V10h4.6c2.8 0 4.6 1.6 4.6 3.9 0 1.7-.9 3-2.5 3.5L20 22h-3.4l-2.9-4.2H12.9V22H10z" fill="#fff" />
            <circle cx="23.5" cy="8.5" r="1.7" fill="#1F7A5C" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-white">
          Hospeda <span className="text-accent">Link</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
              )
            }
          >
            <item.icon size={18} weight="regular" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

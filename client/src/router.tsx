import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { Home } from "./pages/Home";

const AdminLayout = lazy(() =>
  import("./layouts/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const SolicitarHospedagem = lazy(() =>
  import("./pages/SolicitarHospedagem").then((m) => ({ default: m.SolicitarHospedagem })),
);
const CatalogoParceiros = lazy(() =>
  import("./pages/CatalogoParceiros").then((m) => ({ default: m.CatalogoParceiros })),
);
const ParceiroPublico = lazy(() =>
  import("./pages/ParceiroPublico").then((m) => ({ default: m.ParceiroPublico })),
);
const Privacidade = lazy(() =>
  import("./pages/Privacidade").then((m) => ({ default: m.Privacidade })),
);
const Termos = lazy(() => import("./pages/Termos").then((m) => ({ default: m.Termos })));
const Login = lazy(() => import("./pages/admin/Login").then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import("./pages/admin/Dashboard").then((m) => ({ default: m.Dashboard })));
const Solicitacoes = lazy(() =>
  import("./pages/admin/Solicitacoes").then((m) => ({ default: m.Solicitacoes })),
);
const SolicitacaoDetalhe = lazy(() =>
  import("./pages/admin/SolicitacaoDetalhe").then((m) => ({ default: m.SolicitacaoDetalhe })),
);
const Parceiros = lazy(() =>
  import("./pages/admin/Parceiros").then((m) => ({ default: m.Parceiros })),
);
const ParceiroForm = lazy(() =>
  import("./pages/admin/ParceiroForm").then((m) => ({ default: m.ParceiroForm })),
);
const ParceiroDetalhe = lazy(() =>
  import("./pages/admin/ParceiroDetalhe").then((m) => ({ default: m.ParceiroDetalhe })),
);
const Negociacoes = lazy(() =>
  import("./pages/admin/Negociacoes").then((m) => ({ default: m.Negociacoes })),
);
const Contratos = lazy(() =>
  import("./pages/admin/Contratos").then((m) => ({ default: m.Contratos })),
);
const Configuracoes = lazy(() =>
  import("./pages/admin/Configuracoes").then((m) => ({ default: m.Configuracoes })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

const wrap = (el: React.ReactNode) => <Suspense fallback={<PageFallback />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/solicitar-hospedagem", element: wrap(<SolicitarHospedagem />) },
      { path: "/parceiros", element: wrap(<CatalogoParceiros />) },
      { path: "/parceiros/:id", element: wrap(<ParceiroPublico />) },
      { path: "/privacidade", element: wrap(<Privacidade />) },
      { path: "/termos", element: wrap(<Termos />) },
    ],
  },
  { path: "/admin/login", element: wrap(<Login />) },
  {
    path: "/admin",
    element: wrap(<AdminLayout />),
    children: [
      { index: true, element: wrap(<Dashboard />) },
      { path: "solicitacoes", element: wrap(<Solicitacoes />) },
      { path: "solicitacoes/:id", element: wrap(<SolicitacaoDetalhe />) },
      { path: "parceiros", element: wrap(<Parceiros />) },
      { path: "parceiros/novo", element: wrap(<ParceiroForm />) },
      { path: "parceiros/:id", element: wrap(<ParceiroDetalhe />) },
      { path: "parceiros/:id/editar", element: wrap(<ParceiroForm />) },
      { path: "negociacoes", element: wrap(<Negociacoes />) },
      { path: "contratos", element: wrap(<Contratos />) },
      { path: "configuracoes", element: wrap(<Configuracoes />) },
    ],
  },
]);

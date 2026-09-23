import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export function PublicLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header overlay={pathname === "/"} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

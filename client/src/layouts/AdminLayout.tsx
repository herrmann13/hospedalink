import { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-brand-strong lg:block">
        <Sidebar />
        <div className="border-t border-white/10 px-3 py-4">
          <div className="px-3">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-white/50">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <SignOut size={18} weight="regular" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <span className="text-[15px] font-semibold text-ink">
            Hospeda <span className="text-accent">Link</span>
          </span>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink"
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-brand-strong/40" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 bg-brand-strong">
              <Sidebar onNavigate={() => setMenuOpen(false)} />
              <div className="border-t border-white/10 px-3 py-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <SignOut size={18} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { ReactNode, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Users, Menu, X, Home } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  onNavigateHome: () => void;
}

export default function MainLayout({ children, onNavigateHome }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <button
              onClick={onNavigateHome}
              className="flex items-center hover:opacity-80 transition"
            >
              <Users className="w-8 h-8 text-slate-700" />
              <span className="ml-3 text-xl font-bold text-slate-900">
                Gestão de Igreja
              </span>
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={onNavigateHome}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                Início
              </button>

              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <span>Usuário:</span>
                <span className="font-medium text-slate-900">
                  {user?.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <button
                onClick={() => {
                  onNavigateHome();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                Início
              </button>
              <div className="text-sm text-slate-600">
                <span>Usuário: </span>
                <span className="font-medium text-slate-900">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

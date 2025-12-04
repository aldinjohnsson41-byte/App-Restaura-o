import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/Auth/LoginForm';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import PessoasPage from './pages/PessoasPage';
import MinisteriosPage from './pages/MinisteriosPage';
import GruposFamiliaresPage from './pages/GruposFamiliaresPage';
import CargosPage from './pages/CargosPage';
import CalendarPage from './pages/CalendarPage';

type PageType = 'home' | 'pessoas' | 'ministerios' | 'grupos' | 'cargos' | 'agenda';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={(page) => setCurrentPage(page as PageType)} />;
      case 'pessoas':
        return <PessoasPage onBack={() => setCurrentPage('home')} />;
      case 'ministerios':
        return <MinisteriosPage onBack={() => setCurrentPage('home')} />;
      case 'grupos':
        return <GruposFamiliaresPage onBack={() => setCurrentPage('home')} />;
      case 'cargos':
        return <CargosPage onBack={() => setCurrentPage('home')} />;
      case 'agenda':
        return <CalendarPage onBack={() => setCurrentPage('home')} />;
      default:
        return <HomePage onNavigate={(page) => setCurrentPage(page as PageType)} />;
    }
  };

  return (
    <MainLayout onNavigateHome={() => setCurrentPage('home')}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;

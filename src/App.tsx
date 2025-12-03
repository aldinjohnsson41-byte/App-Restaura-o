import { useAuth } from './hooks/useAuth';
import LoginForm from './components/Auth/LoginForm';
import MainLayout from './components/Layout/MainLayout';
import PessoasPage from './pages/PessoasPage';

function App() {
  const { user, loading } = useAuth();

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

  return (
    <MainLayout>
      <PessoasPage />
    </MainLayout>
  );
}

export default App;

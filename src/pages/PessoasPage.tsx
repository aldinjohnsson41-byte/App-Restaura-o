import { useState } from 'react';
import { Pessoa } from '../lib/supabase';
import PessoasList from '../components/Pessoas/PessoasList';
import PessoaForm from '../components/Pessoas/PessoaForm';
import PessoaDetails from '../components/Pessoas/PessoaDetails';
import { ArrowLeft } from 'lucide-react';

type ViewMode = 'list' | 'form' | 'details';

interface PessoasPageProps {
  onBack?: () => void;
}

export default function PessoasPage({ onBack }: PessoasPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPessoa, setSelectedPessoa] = useState<Pessoa | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNew = () => {
    setSelectedPessoa(null);
    setViewMode('form');
  };

  const handleEdit = (pessoa: Pessoa) => {
    setSelectedPessoa(pessoa);
    setViewMode('form');
  };

  const handleView = (pessoa: Pessoa) => {
    setSelectedPessoa(pessoa);
    setViewMode('details');
  };

  const handleSave = () => {
    setViewMode('list');
    setSelectedPessoa(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedPessoa(null);
  };

  const handleCloseDetails = () => {
    setViewMode('list');
    setSelectedPessoa(null);
  };

  return (
    <div>
      {viewMode === 'list' && (
        <div className="space-y-6">
          {onBack && (
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Pessoas</h2>
                <p className="text-slate-600 text-sm">Cadastro e gestão de membros</p>
              </div>
            </div>
          )}
          <PessoasList
            onNew={handleNew}
            onEdit={handleEdit}
            onView={handleView}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {viewMode === 'form' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedPessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
            </h2>
          </div>
          <PessoaForm pessoa={selectedPessoa} onSave={handleSave} onCancel={handleCancel} />
        </div>
      )}

      {viewMode === 'details' && selectedPessoa && (
        <PessoaDetails pessoaId={selectedPessoa.id} onClose={handleCloseDetails} />
      )}
    </div>
  );
}

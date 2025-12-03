import { useState, useEffect } from 'react';
import { supabase, Cargo } from '../lib/supabase';
import { Plus, Edit, Trash2, Settings, ArrowLeft, X, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface CargosPageProps {
  onBack: () => void;
}

export default function CargosPage({ onBack }: CargosPageProps) {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  useEffect(() => {
    loadCargos();
  }, []);

  const loadCargos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cargos')
      .select('*')
      .order('nome');

    if (data && !error) {
      setCargos(data);
    }
    setLoading(false);
  };

  const handleNew = () => {
    setEditingCargo(null);
    setFormData({ nome: '', descricao: '' });
    setShowForm(true);
    setError('');
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingCargo) {
        const { error: updateError } = await supabase
          .from('cargos')
          .update(formData)
          .eq('id', editingCargo.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cargos')
          .insert(formData);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setFormData({ nome: '', descricao: '' });
      loadCargos();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cargo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cargo?')) return;

    const { error } = await supabase.from('cargos').delete().eq('id', id);

    if (!error) {
      loadCargos();
    } else {
      alert('Erro ao excluir cargo');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCargo(null);
    setFormData({ nome: '', descricao: '' });
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Cargos</h2>
          <p className="text-slate-600 text-sm">Gerenciar cargos da igreja</p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Cargo
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {editingCargo ? 'Editar Cargo' : 'Novo Cargo'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Cargo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Ex: Pastor, Diácono, Presbítero..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Descrição do cargo..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando...</p>
        </div>
      ) : cargos.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Nenhum cargo cadastrado</p>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Cargo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-slate-400 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{cargo.nome}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(cargo.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {cargo.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {cargo.descricao}
                </p>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(cargo)}
                  className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cargo.id)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-slate-600">
        Total: {cargos.length} cargo(s)
      </div>
    </div>
  );
}

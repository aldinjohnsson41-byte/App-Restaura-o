import { useState, useEffect } from 'react';
import { supabase, Ministerio } from '../lib/supabase';
import { Plus, Edit, Trash2, BookOpen, ArrowLeft, X, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MinisteriosPageProps {
  onBack: () => void;
}

export default function MinisteriosPage({ onBack }: MinisteriosPageProps) {
  const { user } = useAuth();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMinisterio, setEditingMinisterio] = useState<Ministerio | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  useEffect(() => {
    loadMinisterios();
  }, []);

  const loadMinisterios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ministerios')
      .select('*')
      .order('nome');

    if (data && !error) {
      setMinisterios(data);
    }
    setLoading(false);
  };

  const handleNew = () => {
    setEditingMinisterio(null);
    setFormData({ nome: '', descricao: '' });
    setShowForm(true);
    setError('');
  };

  const handleEdit = (ministerio: Ministerio) => {
    setEditingMinisterio(ministerio);
    setFormData({
      nome: ministerio.nome,
      descricao: ministerio.descricao || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingMinisterio) {
        const { error: updateError } = await supabase
          .from('ministerios')
          .update(formData)
          .eq('id', editingMinisterio.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ministerios')
          .insert(formData);

        if (insertError) throw insertError;
      }

      setShowForm(false);
      setFormData({ nome: '', descricao: '' });
      loadMinisterios();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar ministério');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este ministério?')) return;

    const { error } = await supabase.from('ministerios').delete().eq('id', id);

    if (!error) {
      loadMinisterios();
    } else {
      alert('Erro ao excluir ministério');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMinisterio(null);
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
          <h2 className="text-2xl font-bold text-slate-900">Ministérios</h2>
          <p className="text-slate-600 text-sm">Gerenciar ministérios da igreja</p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Ministério
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {editingMinisterio ? 'Editar Ministério' : 'Novo Ministério'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Ministério *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Louvor, Infantil, Intercessão..."
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descrição do ministério..."
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
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
      ) : ministerios.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Nenhum ministério cadastrado</p>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Ministério
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ministerios.map((ministerio) => (
            <div
              key={ministerio.id}
              className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-green-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ministerio.nome}</h3>
                    <p className="text-xs text-slate-500">
                      {new Date(ministerio.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {ministerio.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {ministerio.descricao}
                </p>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(ministerio)}
                  className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(ministerio.id)}
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
        Total: {ministerios.length} ministério(s)
      </div>
    </div>
  );
}

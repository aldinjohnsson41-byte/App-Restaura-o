import { useState, useEffect } from 'react';
import { supabase, GrupoFamiliar, Pessoa } from '../lib/supabase';
import { Plus, Edit, Trash2, UsersRound, ArrowLeft, X, Save, User, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface GruposFamiliaresPageProps {
  onBack: () => void;
}

interface GrupoWithDetails extends GrupoFamiliar {
  lider?: Pessoa;
  co_lider?: Pessoa;
  membros_count?: number;
}

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoWithDetails[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoFamiliar | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    co_lider_id: '',
  });

  useEffect(() => {
    loadGrupos();
    loadPessoas();
  }, []);

  const loadGrupos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grupos_familiares')
      .select(`
        *,
        lider:lider_id(id, nome_completo, telefone),
        co_lider:co_lider_id(id, nome_completo, telefone)
      `)
      .order('nome');

    if (data && !error) {
      const gruposWithMembros = await Promise.all(
        data.map(async (grupo) => {
          const { count } = await supabase
            .from('pessoas')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_familiar_id', grupo.id);

          return {
            ...grupo,
            lider: Array.isArray(grupo.lider) ? grupo.lider[0] : grupo.lider,
            co_lider: Array.isArray(grupo.co_lider) ? grupo.co_lider[0] : grupo.co_lider,
            membros_count: count || 0,
          };
        })
      );

      setGrupos(gruposWithMembros);
    }
    setLoading(false);
  };

  const loadPessoas = async () => {
    const { data } = await supabase
      .from('pessoas')
      .select('id, nome_completo')
      .order('nome_completo');

    if (data) setPessoas(data);
  };

  const handleNew = () => {
    setEditingGrupo(null);
    setFormData({ nome: '', descricao: '', lider_id: '', co_lider_id: '' });
    setShowForm(true);
    setError('');
  };

  const handleEdit = (grupo: GrupoFamiliar) => {
    setEditingGrupo(grupo);
    setFormData({
      nome: grupo.nome,
      descricao: grupo.descricao || '',
      lider_id: grupo.lider_id || '',
      co_lider_id: grupo.co_lider_id || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.lider_id && formData.lider_id === formData.co_lider_id) {
      setError('O líder e co-líder devem ser pessoas diferentes');
      return;
    }

    setLoading(true);

    try {
      const grupoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        lider_id: formData.lider_id || null,
        co_lider_id: formData.co_lider_id || null,
      };

      if (editingGrupo) {
        const { error: updateError } = await supabase
          .from('grupos_familiares')
          .update(grupoData)
          .eq('id', editingGrupo.id);

        if (updateError) throw updateError;

        if (editingGrupo.lider_id && editingGrupo.lider_id !== formData.lider_id) {
          await supabase
            .from('pessoas')
            .update({ papel_grupo: 'membro' })
            .eq('id', editingGrupo.lider_id)
            .eq('grupo_familiar_id', editingGrupo.id);
        }

        if (editingGrupo.co_lider_id && editingGrupo.co_lider_id !== formData.co_lider_id) {
          await supabase
            .from('pessoas')
            .update({ papel_grupo: 'membro' })
            .eq('id', editingGrupo.co_lider_id)
            .eq('grupo_familiar_id', editingGrupo.id);
        }

        if (formData.lider_id) {
          await supabase
            .from('pessoas')
            .update({
              grupo_familiar_id: editingGrupo.id,
              papel_grupo: 'líder'
            })
            .eq('id', formData.lider_id);
        }

        if (formData.co_lider_id) {
          await supabase
            .from('pessoas')
            .update({
              grupo_familiar_id: editingGrupo.id,
              papel_grupo: 'co-líder'
            })
            .eq('id', formData.co_lider_id);
        }
      } else {
        const { data: newGrupo, error: insertError } = await supabase
          .from('grupos_familiares')
          .insert(grupoData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (newGrupo) {
          if (formData.lider_id) {
            await supabase
              .from('pessoas')
              .update({
                grupo_familiar_id: newGrupo.id,
                papel_grupo: 'líder'
              })
              .eq('id', formData.lider_id);
          }

          if (formData.co_lider_id) {
            await supabase
              .from('pessoas')
              .update({
                grupo_familiar_id: newGrupo.id,
                papel_grupo: 'co-líder'
              })
              .eq('id', formData.co_lider_id);
          }
        }
      }

      setShowForm(false);
      setFormData({ nome: '', descricao: '', lider_id: '', co_lider_id: '' });
      loadGrupos();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar grupo familiar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este grupo familiar?')) return;

    await supabase
      .from('pessoas')
      .update({ grupo_familiar_id: null, papel_grupo: null })
      .eq('grupo_familiar_id', id);

    const { error } = await supabase.from('grupos_familiares').delete().eq('id', id);

    if (!error) {
      loadGrupos();
    } else {
      alert('Erro ao excluir grupo familiar');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGrupo(null);
    setFormData({ nome: '', descricao: '', lider_id: '', co_lider_id: '' });
    setError('');
  };

  const getPessoasDisponiveis = (tipo: 'lider' | 'co_lider') => {
    const outraSelecao = tipo === 'lider' ? formData.co_lider_id : formData.lider_id;
    return pessoas.filter(p => p.id !== outraSelecao);
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
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">Gerenciar células e grupos familiares</p>
        </div>
        {!showForm && (
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Grupo
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            {editingGrupo ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do Grupo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: Grupo Família Silva, Célula Centro..."
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Informações sobre o grupo, localização, horário de reunião..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Líder do Grupo
                </label>
                <select
                  value={formData.lider_id}
                  onChange={(e) => setFormData({ ...formData, lider_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('lider').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Co-líder do Grupo
                </label>
                <select
                  value={formData.co_lider_id}
                  onChange={(e) => setFormData({ ...formData, co_lider_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('co_lider').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>
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
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
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
      ) : grupos.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <UsersRound className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Nenhum grupo familiar cadastrado</p>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UsersRound className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{grupo.nome}</h3>
                    <p className="text-xs text-slate-500">
                      {grupo.membros_count} membro(s)
                    </p>
                  </div>
                </div>
              </div>

              {grupo.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {grupo.descricao}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {grupo.lider && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Líder:</span>
                    <span className="text-slate-900 font-medium">{grupo.lider.nome_completo}</span>
                  </div>
                )}
                {grupo.co_lider && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Co-líder:</span>
                    <span className="text-slate-900 font-medium">{grupo.co_lider.nome_completo}</span>
                  </div>
                )}
                {!grupo.lider && !grupo.co_lider && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 italic">
                    <User className="w-4 h-4" />
                    Sem liderança definida
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(grupo)}
                  className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(grupo.id)}
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
        Total: {grupos.length} grupo(s) familiar(es)
      </div>
    </div>
  );
}

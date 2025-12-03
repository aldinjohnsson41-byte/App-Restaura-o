import React, { useEffect, useState } from 'react';
import { supabase, GrupoFamiliar, Pessoa } from '../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  UsersRound,
  ArrowLeft,
  X,
  Save,
  User,
  Calendar,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// ======================================
// Página completa de Grupos Familiares
// - Cria/edita/exclui grupos
// - Até 2 líderes e 2 co-líderes (colunas: lider_1_id, lider_2_id, co_lider_1_id, co_lider_2_id)
// - Adicionar membros 1 a 1 via modal de busca (Opção A)
// - Armazena membros no campo pessoas.grupo_familiar_id e pessoas.papel_grupo
// - Gerencia ocorrências (usa campos existentes: tipo_ocorrencia_id, pessoa_id, data_ocorrencia, descricao) + grupo_id
// ======================================

interface GruposFamiliaresPageProps {
  onBack: () => void;
}

interface GrupoWithDetails extends GrupoFamiliar {
  lider_1?: Pessoa | null;
  lider_2?: Pessoa | null;
  co_lider_1?: Pessoa | null;
  co_lider_2?: Pessoa | null;
  membros_count?: number;
}

interface Ocorrencia {
  id?: string;
  tipo_ocorrencia_id?: string | null;
  pessoa_id?: string | null;
  data_ocorrencia?: string | null;
  descricao?: string | null;
  grupo_id?: string | null;
}

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoWithDetails[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrupoWithDetails | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    lider_1_id: '',
    lider_2_id: '',
    co_lider_1_id: '',
    co_lider_2_id: '',
    membros_ids: [] as string[]
  });

  // Modal adicionar membro
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pessoa[]>([]);

  // ocorrências
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [ocorrenciaForm, setOcorrenciaForm] = useState<Ocorrencia>({ tipo_ocorrencia_id: '', pessoa_id: '', data_ocorrencia: '', descricao: '', grupo_id: '' });
  const [tiposOcorrencia, setTiposOcorrencia] = useState<{ id: string; nome: string }[]>([]);

  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadGrupos(), loadPessoas(), loadTiposOcorrencia()]);
    setLoading(false);
  }

  async function loadGrupos() {
    const { data, error } = await supabase
  .from('grupos_familiares')
  .select(`
    *,
    lider_1:lider_1_id ( id, nome_completo ),
    lider_2:lider_2_id ( id, nome_completo ),
    co_lider_1:co_lider_1_id ( id, nome_completo ),
    co_lider_2:co_lider_2_id ( id, nome_completo )
  `)
  .order('nome');


    if (error) {
      console.error('Erro ao carregar grupos', error);
      return;
    }

    // contar membros por grupo
    const gruposWithCounts = await Promise.all((data || []).map(async (g: any) => {
      const { count } = await supabase
        .from('pessoas')
        .select('*', { head: true, count: 'exact' })
        .eq('grupo_familiar_id', g.id);

      return {
        ...g,
        lider_1: Array.isArray(g.lider_1) ? g.lider_1[0] : g.lider_1,
        lider_2: Array.isArray(g.lider_2) ? g.lider_2[0] : g.lider_2,
        co_lider_1: Array.isArray(g.co_lider_1) ? g.co_lider_1[0] : g.co_lider_1,
        co_lider_2: Array.isArray(g.co_lider_2) ? g.co_lider_2[0] : g.co_lider_2,
        membros_count: count || 0
      } as GrupoWithDetails;
    }));

    setGrupos(gruposWithCounts || []);
  }

  async function loadPessoas() {
    const { data, error } = await supabase
      .from('pessoas')
      .select('id, nome_completo, telefone, grupo_familiar_id')
      .order('nome_completo');

    if (error) {
      console.error('Erro ao carregar pessoas', error);
      return;
    }

    setPessoas(data || []);
  }

  async function loadTiposOcorrencia() {
    // tenta carregar tabela de tipos, se existir
    const { data } = await supabase.from('tipo_ocorrencia').select('id, nome').order('nome');
    if (data) setTiposOcorrencia(data as any);
  }

  // abrir formulário novo
  function handleNew() {
    setEditing(null);
    setForm({ nome: '', descricao: '', lider_1_id: '', lider_2_id: '', co_lider_1_id: '', co_lider_2_id: '', membros_ids: [] });
    setOcorrencias([]);
    setError('');
    setShowForm(true);
  }

  




  async function handleEdit(grupo: GrupoWithDetails) {
    setEditing(grupo);
    setForm({
      nome: grupo.nome || '',
      descricao: grupo.descricao || '',
      lider_1_id: (grupo as any).lider_1?.id || '',
      lider_2_id: (grupo as any).lider_2?.id || '',
      co_lider_1_id: (grupo as any).co_lider_1?.id || '',
      co_lider_2_id: (grupo as any).co_lider_2?.id || '',
      membros_ids: []
    });

    // carregar membros atuais via pessoas.grupo_familiar_id
    const { data: membrosData } = await supabase
      .from('pessoas')
      .select('id, nome_completo')
      .eq('grupo_familiar_id', grupo.id)
      .order('nome_completo');

    if (membrosData) {
      setForm(prev => ({ ...prev, membros_ids: (membrosData as any).map((m: any) => m.id) }));
    }

    // carregar ocorrências do grupo
    const { data: ocorrs } = await supabase
      .from('ocorrencias')
      .select('id, tipo_ocorrencia_id, pessoa_id, data_ocorrencia, descricao')
      .eq('grupo_id', grupo.id)
      .order('data_ocorrencia', { ascending: false });

    setOcorrencias(ocorrs || []);

    setError('');
    setShowForm(true);
  }

  // salvar grupo (create/update)
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    // validações
    if (!form.nome.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    const leaderIds = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean);
    // verificar duplicidade entre lideranças
    const dup = leaderIds.some((id, idx) => leaderIds.indexOf(id) !== idx);
    if (dup) {
      setError('Uma mesma pessoa não pode ocupar mais de um papel de liderança');
      return;
    }

    setLoading(true);
    try {
      let grupoId: string | undefined;

      if (editing) {
        const { error } = await supabase
          .from('grupos_familiares')
          .update({
            nome: form.nome,
            descricao: form.descricao || null,
            lider_1_id: form.lider_1_id || null,
            lider_2_id: form.lider_2_id || null,
            co_lider_1_id: form.co_lider_1_id || null,
            co_lider_2_id: form.co_lider_2_id || null
          })
          .eq('id', editing.id);

        if (error) throw error;
        grupoId = editing.id;
      } else {
        const { data, error } = await supabase
          .from('grupos_familiares')
          .insert({
            nome: form.nome,
            descricao: form.descricao || null,
            lider_1_id: form.lider_1_id || null,
            lider_2_id: form.lider_2_id || null,
            co_lider_1_id: form.co_lider_1_id || null,
            co_lider_2_id: form.co_lider_2_id || null
          })
          .select()
          .single();

        if (error) throw error;
        grupoId = data.id;
      }

      // Agora sincronizar membros no campo pessoas.grupo_familiar_id
      // Primeiro: pegar todas as pessoas que atualmente têm esse grupo (se editar)
      const { data: currentMembers } = await supabase
        .from('pessoas')
        .select('id')
        .eq('grupo_familiar_id', grupoId);

      const currentIds = (currentMembers || []).map((m: any) => m.id);
      const newIds = form.membros_ids;

      // IDs para adicionar e para remover
      const toAdd = newIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !newIds.includes(id));

      // adicionar (atualizar grupo_familiar_id e papel_grupo se necessário)
      for (const id of toAdd) {
        // se a pessoa for líder/co-líder, priorizamos papel correspondente
        const papel =
          id === form.lider_1_id || id === form.lider_2_id ? 'líder' :
          id === form.co_lider_1_id || id === form.co_lider_2_id ? 'co-líder' : 'membro';

        await supabase
          .from('pessoas')
          .update({ grupo_familiar_id: grupoId, papel_grupo: papel })
          .eq('id', id);
      }

      // remover
      for (const id of toRemove) {
        await supabase
          .from('pessoas')
          .update({ grupo_familiar_id: null, papel_grupo: null })
          .eq('id', id);
      }

      // garantir que líderes/co-líderes tenham papel correto e estão vinculados ao grupo
      const leaderSet = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean) as string[];
      for (const id of leaderSet) {
        await supabase
          .from('pessoas')
          .update({ grupo_familiar_id: grupoId, papel_grupo: (id === form.lider_1_id || id === form.lider_2_id) ? 'líder' : 'co-líder' })
          .eq('id', id);
      }

      // se alguém era líder antes e agora não é mais, ajustar papel (se permanecer no grupo será 'membro', senão null)
      if (editing) {
        const prevLeaderIds = [editing.lider_1?.id, editing.lider_2?.id, editing.co_lider_1?.id, editing.co_lider_2?.id].filter(Boolean) as string[];
        for (const prev of prevLeaderIds) {
          if (!leaderSet.includes(prev)) {
            // se ainda está no grupo (membros_ids), manter 'membro', caso contrário limpar
            const stillMember = form.membros_ids.includes(prev);
            await supabase
              .from('pessoas')
              .update({ papel_grupo: stillMember ? 'membro' : null })
              .eq('id', prev)
              .eq('grupo_familiar_id', grupoId);
          }
        }
      }

      // carregar dados atualizados
      await loadPessoas();
      await loadGrupos();
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  }

  // deletar grupo
  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este grupo?')) return;
    setLoading(true);
    try {
      // limpar pessoas vinculadas
      await supabase
        .from('pessoas')
        .update({ grupo_familiar_id: null, papel_grupo: null })
        .eq('grupo_familiar_id', id);

      // remover ocorrências vinculadas (opcional, dependendo da regra de negocio)
      await supabase.from('ocorrencias').delete().eq('grupo_id', id);

      // excluir grupo
      const { error } = await supabase.from('grupos_familiares').delete().eq('id', id);
      if (error) throw error;

      await loadGrupos();
      await loadPessoas();
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir grupo');
    } finally {
      setLoading(false);
    }
  }

  // Modal - busca e adicionar membro 1 a 1
  useEffect(() => {
    async function buscar() {
      if (!searchQuery) {
        setSearchResults(pessoas.filter(p => !form.membros_ids.includes(p.id)));
        return;
      }
      const q = searchQuery.toLowerCase();
      setSearchResults(pessoas.filter(p => (p.nome_completo || '').toLowerCase().includes(q) && !form.membros_ids.includes(p.id)));
    }
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pessoas, form.membros_ids]);

  function openModal() {
    setSearchQuery('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function addMemberLocal(id: string) {
    if (!form.membros_ids.includes(id)) {
      setForm(prev => ({ ...prev, membros_ids: [...prev.membros_ids, id] }));
    }
  }

  function removeMemberLocal(id: string) {
    setForm(prev => ({ ...prev, membros_ids: prev.membros_ids.filter(x => x !== id) }));
  }

  // OCORRÊNCIAS CRUD (apenas quando editing existe)
  async function addOcorrencia(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    if (!editing) {
      setError('Salve o grupo antes de adicionar ocorrências');
      return;
    }
    if (!ocorrenciaForm.tipo_ocorrencia_id || !ocorrenciaForm.data_ocorrencia) {
      setError('Tipo e data são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tipo_ocorrencia_id: ocorrenciaForm.tipo_ocorrencia_id,
        pessoa_id: ocorrenciaForm.pessoa_id || null,
        data_ocorrencia: ocorrenciaForm.data_ocorrencia,
        descricao: ocorrenciaForm.descricao || null,
        grupo_id: editing.id
      };

      const { data, error } = await supabase.from('ocorrencias').insert(payload).select().single();
      if (error) throw error;
      setOcorrencias(prev => [data, ...prev]);
      setOcorrenciaForm({ tipo_ocorrencia_id: '', pessoa_id: '', data_ocorrencia: '', descricao: '', grupo_id: '' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao adicionar ocorrência');
    } finally {
      setLoading(false);
    }
  }

  async function deleteOcorrencia(id?: string) {
    if (!id) return;
    if (!confirm('Remover ocorrência?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
      if (error) throw error;
      setOcorrencias(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao remover ocorrência');
    } finally {
      setLoading(false);
    }
  }

  // UI
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">Gerencie células, líderes, membros e ocorrências</p>
        </div>
        {!showForm && (
          <button onClick={handleNew} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Grupo
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">{editing ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Grupo *</label>
              <input type="text" required value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Ex: Grupo Família Silva" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
              <textarea value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Informações sobre o grupo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Líder 1</label>
                <select value={form.lider_1_id} onChange={e => setForm(prev => ({ ...prev, lider_1_id: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Selecione...</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Líder 2 (opcional)</label>
                <select value={form.lider_2_id} onChange={e => setForm(prev => ({ ...prev, lider_2_id: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Selecione...</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Co-líder 1</label>
                <select value={form.co_lider_1_id} onChange={e => setForm(prev => ({ ...prev, co_lider_1_id: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Selecione...</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Co-líder 2 (opcional)</label>
                <select value={form.co_lider_2_id} onChange={e => setForm(prev => ({ ...prev, co_lider_2_id: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                  <option value="">Selecione...</option>
                  {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                </select>
              </div>
            </div>

            {/* membros - setlist via modal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Membros</label>
                <button type="button" className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={openModal}><Plus className="w-4 h-4" /> Adicionar membro</button>
              </div>

              <div className="space-y-2">
                {form.membros_ids.map(id => {
                  const p = pessoas.find(x => x.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between border p-2 rounded">
                      <div className="flex items-center gap-3">
                        <UsersRound className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="text-sm font-medium">{p?.nome_completo}</div>
                          <div className="text-xs text-slate-500">{p?.telefone || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-sm text-red-600" onClick={() => removeMemberLocal(id)}>Remover</button>
                      </div>
                    </div>
                  );
                })}

                {form.membros_ids.length === 0 && <div className="text-sm text-slate-500 italic">Nenhum membro adicionado</div>}
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(''); }} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>

          {/* ocorrências (aparece quando editing) */}
          {editing && (
            <div className="mt-6 border-t pt-6">
              <h4 className="font-semibold text-slate-800 mb-3">Ocorrências</h4>
              <form onSubmit={addOcorrencia} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Tipo *</label>
                  <select value={ocorrenciaForm.tipo_ocorrencia_id || ''} onChange={e => setOcorrenciaForm(prev => ({ ...prev, tipo_ocorrencia_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">Selecione...</option>
                    {tiposOcorrencia.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Data *</label>
                  <input type="date" value={ocorrenciaForm.data_ocorrencia || ''} onChange={e => setOcorrenciaForm(prev => ({ ...prev, data_ocorrencia: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Membro (opcional)</label>
                  <select value={ocorrenciaForm.pessoa_id || ''} onChange={e => setOcorrenciaForm(prev => ({ ...prev, pessoa_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">Nenhum</option>
                    {pessoas.filter(p => p.grupo_familiar_id === editing.id).map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Observação</label>
                  <div className="flex gap-2">
                    <input type="text" value={ocorrenciaForm.descricao || ''} onChange={e => setOcorrenciaForm(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Observação" />
                    <button className="px-3 py-2 bg-slate-800 text-white rounded-lg">Adicionar</button>
                  </div>
                </div>
              </form>

              <div className="space-y-2 mt-4">
                {ocorrencias.length === 0 ? <div className="text-sm text-slate-500 italic">Sem ocorrências registradas</div> : (
                  ocorrencias.map(o => (
                    <div key={o.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">{o.tipo_ocorrencia_id} <span className="text-xs text-slate-500">— {o.data_ocorrencia}</span></div>
                        {o.pessoa_id && <div className="text-xs text-slate-600">Membro: {pessoas.find(p => p.id === o.pessoa_id)?.nome_completo}</div>}
                        {o.descricao && <div className="text-xs text-slate-600 mt-1">{o.descricao}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-red-600 text-sm" onClick={() => deleteOcorrencia(o.id)}>Remover</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* listagem */}
      {loading && !showForm ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Carregando...</p>
        </div>
      ) : grupos.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <UsersRound className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Nenhum grupo familiar cadastrado</p>
          <button onClick={handleNew} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Cadastrar Primeiro Grupo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(grupo => (
            <div key={grupo.id} className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"><UsersRound className="w-6 h-6 text-orange-600" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{grupo.nome}</h3>
                    <p className="text-xs text-slate-500">{grupo.membros_count} membro(s)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(grupo)} title="Editar" className="p-2 rounded-md hover:bg-slate-50"><Edit className="w-4 h-4 text-slate-600" /></button>
                  <button onClick={() => handleDelete(grupo.id)} title="Excluir" className="p-2 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>

              {grupo.descricao && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{grupo.descricao}</p>}

              <div className="space-y-2 mb-4">
                {grupo.lider_1 && (
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Líder:</span><span className="text-slate-900 font-medium">{(grupo.lider_1 as any).nome_completo}</span></div>
                )}
                {grupo.lider_2 && (
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Líder 2:</span><span className="text-slate-900 font-medium">{(grupo.lider_2 as any).nome_completo}</span></div>
                )}
                {grupo.co_lider_1 && (
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Co-líder:</span><span className="text-slate-900 font-medium">{(grupo.co_lider_1 as any).nome_completo}</span></div>
                )}
                {grupo.co_lider_2 && (
                  <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Co-líder 2:</span><span className="text-slate-900 font-medium">{(grupo.co_lider_2 as any).nome_completo}</span></div>
                )}
                {!grupo.lider_1 && !grupo.co_lider_1 && <div className="flex items-center gap-2 text-sm text-slate-500 italic"><User className="w-4 h-4" />Sem liderança definida</div>}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => handleEdit(grupo)} className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> Editar</button>
                <button onClick={() => handleDelete(grupo.id)} className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-slate-600">Total: {grupos.length} grupo(s) familiar(es)</div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl p-4 rounded shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Adicionar Membro</h3>
              <button onClick={closeModal}><X /></button>
            </div>

            <div className="flex gap-2 mb-3">
              <input placeholder="Buscar por nome" className="flex-1 border px-3 py-2 rounded" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button className="px-3 py-2 bg-slate-800 text-white rounded" onClick={() => { setSearchQuery(''); }}>{<Search />}</button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium">{p.nome_completo}</div>
                    <div className="text-xs text-slate-500">{p.telefone || ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { addMemberLocal(p.id); }}>{<Plus />}</button>
                  </div>
                </div>
              ))}

              {searchResults.length === 0 && (<div className="text-sm text-slate-500">Nenhuma pessoa encontrada</div>)}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 border rounded" onClick={closeModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
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
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PessoaDetails from '../components/Pessoas/PessoaDetails';

// GruposFamiliaresPage.tsx — versão completa e revisada
// - Cria / edita / exclui grupos
// - Modal de visualização do grupo com abas: Dados | Membros | Ocorrências | Histórico
// - Adicionar / remover membros registra entradas em tabela de histórico (grupo_membros_historico)
// - Cada membro tem botão "olho" que abre a Ficha da Pessoa usando o componente PessoaDetails
// - Ocorrências CRUD por grupo
// Observação: ajuste nomes de tabelas/colunas no supabase se necessário

interface GruposFamiliaresPageProps {
  onBack: () => void;
}

type GrupoWithCounts = GrupoFamiliar & {
  membros?: Pessoa[];
  membros_count?: number;
};

type MembroHistorico = {
  id?: string;
  grupo_id?: string;
  pessoa_id?: string;
  acao?: 'adicionado' | 'removido' | 'promovido' | 'rebaixado';
  papel?: string | null;
  data?: string | null; // ISO
  nota?: string | null;
};

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();

  // dados principais
  const [grupos, setGrupos] = useState<GrupoWithCounts[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // form criação/edição
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrupoWithCounts | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    lider_1_id: '',
    lider_2_id: '',
    co_lider_1_id: '',
    co_lider_2_id: '',
    membros_ids: [] as string[]
  });

  // modal de visualização do grupo
  const [showGroupView, setShowGroupView] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<GrupoWithCounts | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'membros' | 'ocorrencias' | 'historico'>('dados');

  // busca para adicionar membro no view modal
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<Pessoa[]>([]);

  // ocorrências do grupo em view
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [ocorrenciaForm, setOcorrenciaForm] = useState({ tipo: '', pessoa_id: '', data: '', descricao: '' });

  // histórico do grupo
  const [historicoGrupo, setHistoricoGrupo] = useState<MembroHistorico[]>([]);

  // NOVOS: estados para abrir PessoaDetails (igual PessoasPage)
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'details'>('list');
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadGrupos(), loadPessoas()]);
    setLoading(false);
  }

  async function loadGrupos() {
    const { data, error } = await supabase.from('grupos_familiares').select('*').order('nome');
    if (error) {
      console.error(error);
      return;
    }
    const gruposRaw = (data || []) as any[];

    // carregar membros_count para cada grupo
    const gruposWithCounts: GrupoWithCounts[] = await Promise.all(gruposRaw.map(async g => {
      const { count } = await supabase.from('pessoas').select('*', { head: true, count: 'exact' }).eq('grupo_familiar_id', g.id);
      return { ...g, membros_count: count || 0 } as GrupoWithCounts;
    }));

    setGrupos(gruposWithCounts);
  }

  async function loadPessoas() {
    const { data, error } = await supabase.from('pessoas').select('*').order('nome_completo');
    if (error) {
      console.error(error);
      return;
    }
    setPessoas(data || []);
  }

  // abrir formulário novo
  function handleNew() {
    setEditing(null);
    setForm({ nome: '', descricao: '', lider_1_id: '', lider_2_id: '', co_lider_1_id: '', co_lider_2_id: '', membros_ids: [] });
    setShowForm(true);
    setError('');
  }

  // abrir edição
  async function handleEdit(grupo: GrupoWithCounts) {
    setEditing(grupo);
    const { data: membrosData } = await supabase.from('pessoas').select('id').eq('grupo_familiar_id', grupo.id).order('nome_completo');
    const membros_ids = (membrosData || []).map((m: any) => m.id);
    setForm({
      nome: grupo.nome || '',
      descricao: (grupo as any).descricao || '',
      lider_1_id: (grupo as any).lider_1_id || '',
      lider_2_id: (grupo as any).lider_2_id || '',
      co_lider_1_id: (grupo as any).co_lider_1_id || '',
      co_lider_2_id: (grupo as any).co_lider_2_id || '',
      membros_ids
    });
    setShowForm(true);
  }

  // salvar grupo
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    if (!form.nome.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    const leaderIds = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean);
    if (new Set(leaderIds).size !== leaderIds.length) {
      setError('Uma mesma pessoa não pode ocupar mais de um papel de liderança');
      return;
    }

    setLoading(true);
    try {
      let grupoId: string | undefined;
      if (editing) {
        const { error } = await supabase.from('grupos_familiares').update({
          nome: form.nome,
          descricao: form.descricao || null,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        }).eq('id', editing.id);
        if (error) throw error;
        grupoId = editing.id;
      } else {
        const { data, error } = await supabase.from('grupos_familiares').insert({
          nome: form.nome,
          descricao: form.descricao || null,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        }).select().single();
        if (error) throw error;
        grupoId = data.id;
      }

      // sincronizar membros e registrar histórico
      const { data: currentMembers } = await supabase.from('pessoas').select('id').eq('grupo_familiar_id', grupoId);
      const currentIds = (currentMembers || []).map((m: any) => m.id);
      const newIds = form.membros_ids;

      const toAdd = newIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter((id: string) => !newIds.includes(id));
      const now = new Date().toISOString();

      for (const id of toAdd) {
        const papel = id === form.lider_1_id || id === form.lider_2_id ? 'líder' : id === form.co_lider_1_id || id === form.co_lider_2_id ? 'co-líder' : 'membro';
        await supabase.from('pessoas').update({ grupo_familiar_id: grupoId, papel_grupo: papel }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({ grupo_id: grupoId, pessoa_id: id, acao: 'adicionado', papel, data: now, nota: editing ? 'Adicionado na edição' : 'Adicionado ao criar grupo' });
      }

      for (const id of toRemove) {
        await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({ grupo_id: grupoId, pessoa_id: id, acao: 'removido', papel: null, data: now, nota: 'Removido na edição' });
      }

      // garantir papel correto para líderes/co-líderes (mesmo que não estivessem na lista)
      const leaderSet = leaderIds as string[];
      for (const id of leaderSet) {
        const papel = id === form.lider_1_id || id === form.lider_2_id ? 'líder' : 'co-líder';
        await supabase.from('pessoas').update({ grupo_familiar_id: grupoId, papel_grupo: papel }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({ grupo_id: grupoId, pessoa_id: id, acao: 'promovido', papel, data: now, nota: 'Definido como liderança' });
      }

      // rebaixar ex-líderes que perderam posição
      if (editing) {
        const prevLeaders = [ (editing as any).lider_1_id, (editing as any).lider_2_id, (editing as any).co_lider_1_id, (editing as any).co_lider_2_id ].filter(Boolean) as string[];
        for (const prev of prevLeaders) {
          if (!leaderSet.includes(prev)) {
            const stillMember = form.membros_ids.includes(prev);
            await supabase.from('pessoas').update({ papel_grupo: stillMember ? 'membro' : null }).eq('id', prev).eq('grupo_familiar_id', grupoId);
            await supabase.from('grupo_membros_historico').insert({ grupo_id: grupoId, pessoa_id: prev, acao: 'rebaixado', papel: stillMember ? 'membro' : null, data: now, nota: 'Perdeu posição de liderança' });
          }
        }
      }

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
  async function handleDelete(grupoId?: string) {
    if (!grupoId) return;
    if (!confirm('Deseja realmente excluir este grupo? Os vínculos serão removidos.')) return;
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('grupo_familiar_id', grupoId);
      await supabase.from('ocorrencias').delete().eq('grupo_id', grupoId);
      await supabase.from('grupo_membros_historico').delete().eq('grupo_id', grupoId);
      const { error } = await supabase.from('grupos_familiares').delete().eq('id', grupoId);
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

  // ---------- VIEW GROUP modal ----------
  async function openGroupView(grupo: GrupoWithCounts) {
    setViewingGroup(grupo);
    setShowGroupView(true);
    setActiveTab('dados');

    // carregar membros completos
    const { data: membros } = await supabase.from('pessoas').select('*').eq('grupo_familiar_id', grupo.id).order('nome_completo');
    const { data: ocorrs } = await supabase.from('ocorrencias').select('*').eq('grupo_id', grupo.id).order('data_ocorrencia', { ascending: false });
    const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', grupo.id).order('data', { ascending: false });

    setViewingGroup(prev => prev ? ({ ...prev, membros: membros || [] }) : null);
    setOcorrencias(ocorrs || []);
    setHistoricoGrupo(hist || []);
  }

  function closeGroupView() {
    setShowGroupView(false);
    setViewingGroup(null);
    setOcorrencias([]);
    setHistoricoGrupo([]);
    setMemberSearch('');
    setMemberSearchResults([]);
  }

  // search members available to add
  useEffect(() => {
    if (!memberSearch) {
      setMemberSearchResults(pessoas.filter(p => p.grupo_familiar_id !== viewingGroup?.id));
      return;
    }
    const q = memberSearch.toLowerCase();
    setMemberSearchResults(pessoas.filter(p => (p.nome_completo || '').toLowerCase().includes(q) && p.grupo_familiar_id !== viewingGroup?.id));
  }, [memberSearch, pessoas, viewingGroup]);

  // adicionar membro na visualização do grupo
  async function addMemberToGroup(person: Pessoa, papel: string = 'membro') {
    if (!viewingGroup) return;
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ grupo_familiar_id: viewingGroup.id, papel_grupo: papel }).eq('id', person.id);
      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({ grupo_id: viewingGroup.id, pessoa_id: person.id, acao: 'adicionado', papel, data: now, nota: 'Adicionado via modal' });
      // reload members + histórico
      const { data: membros } = await supabase.from('pessoas').select('*').eq('grupo_familiar_id', viewingGroup.id).order('nome_completo');
      const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', viewingGroup.id).order('data', { ascending: false });
      setViewingGroup(prev => prev ? ({ ...prev, membros: membros || [] }) : null);
      setHistoricoGrupo(hist || []);
      await loadPessoas();
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  }

  // remover membro e gravar data
  async function removeMemberFromGroup(person: Pessoa) {
    if (!viewingGroup) return;
    if (!confirm(`Remover ${person.nome_completo} do grupo ${viewingGroup.nome}?`)) return;
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', person.id);
      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({ grupo_id: viewingGroup.id, pessoa_id: person.id, acao: 'removido', papel: null, data: now, nota: 'Removido via modal' });
      const { data: membros } = await supabase.from('pessoas').select('*').eq('grupo_familiar_id', viewingGroup.id).order('nome_completo');
      const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', viewingGroup.id).order('data', { ascending: false });
      setViewingGroup(prev => prev ? ({ ...prev, membros: membros || [] }) : null);
      setHistoricoGrupo(hist || []);
      await loadPessoas();
    } catch (e) {
      console.error(e);
      alert('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  }

  // abrir ficha da pessoa — agora abre PessoaDetails (igual PessoasPage)
  function openPessoaFicha(person: Pessoa) {
    // abrimos a mesma view usada em PessoasPage
    setSelectedPessoaId(person.id);
    setViewMode('details');
  }

  function closePessoaFicha() {
    setSelectedPessoaId(null);
    setViewMode('list');
  }

  // ocorrências
  async function addOcorrencia(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!viewingGroup) return setError('Abra um grupo antes');
    if (!ocorrenciaForm.tipo || !ocorrenciaForm.data) return setError('Tipo e data são obrigatórios');
    setLoading(true);
    try {
      const payload = {
        tipo_ocorrencia_id: ocorrenciaForm.tipo,
        pessoa_id: ocorrenciaForm.pessoa_id || null,
        data_ocorrencia: ocorrenciaForm.data,
        descricao: ocorrenciaForm.descricao || null,
        grupo_id: viewingGroup.id
      };
      const { data, error } = await supabase.from('ocorrencias').insert(payload).select().single();
      if (error) throw error;
      setOcorrencias(prev => [data, ...prev]);
      setOcorrenciaForm({ tipo: '', pessoa_id: '', data: '', descricao: '' });
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

  // helpers
  function formatDate(iso?: string | null) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  // UI
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">Gerencie células, líderes, membros e ocorrências</p>
        </div>
        {!showForm && (
          <div className="flex gap-2">
            <button onClick={handleNew} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Grupo</button>
          </div>
        )}
      </div>

      {/* === PessoaDetails view (igual PessoasPage) === */}
      {viewMode === 'details' && selectedPessoaId && (
        <div className="p-4 bg-white rounded-xl border">
          <button onClick={closePessoaFicha} className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-800"><ArrowLeft className="w-4 h-4" /> Voltar</button>
          <PessoaDetails pessoaId={selectedPessoaId} onClose={closePessoaFicha} />
        </div>
      )}

      {/* MAIN PAGE */}
      {viewMode !== 'details' && (
        <>
          {/* form create/edit */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">{editing ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
                  <input value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-4 py-2 border rounded" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                  <textarea value={form.descricao} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} rows={3} className="w-full px-4 py-2 border rounded" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Líder 1</label>
                    <select value={form.lider_1_id} onChange={e => setForm(prev => ({ ...prev, lider_1_id: e.target.value }))} className="w-full px-4 py-2 border rounded">
                      <option value="">Selecione...</option>
                      {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Líder 2</label>
                    <select value={form.lider_2_id} onChange={e => setForm(prev => ({ ...prev, lider_2_id: e.target.value }))} className="w-full px-4 py-2 border rounded">
                      <option value="">Selecione...</option>
                      {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Co-líder 1</label>
                    <select value={form.co_lider_1_id} onChange={e => setForm(prev => ({ ...prev, co_lider_1_id: e.target.value }))} className="w-full px-4 py-2 border rounded">
                      <option value="">Selecione...</option>
                      {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Co-líder 2</label>
                    <select value={form.co_lider_2_id} onChange={e => setForm(prev => ({ ...prev, co_lider_2_id: e.target.value }))} className="w-full px-4 py-2 border rounded">
                      <option value="">Selecione...</option>
                      {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Membros</label>
                    <button type="button" onClick={() => { setShowGroupView(true); setViewingGroup(editing ? editing : ({ id: 'tmp', nome: form.nome } as any)); setActiveTab('membros'); setMemberSearch(''); }} className="px-3 py-1 bg-blue-600 text-white rounded">Abrir Membros</button>
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
                              <div className="text-xs text-slate-500">{(p as any)?.telefone || ''}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, membros_ids: prev.membros_ids.filter(x => x !== id) }))} className="text-sm text-red-600">Remover</button>
                            <button type="button" onClick={() => openPessoaFicha(p as Pessoa)} className="text-sm text-slate-700">Ficha</button>
                          </div>
                        </div>
                      );
                    })}

                    {form.membros_ids.length === 0 && <div className="text-sm text-slate-500 italic">Nenhum membro adicionado</div>}
                  </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError(''); }} className="px-4 py-2 border rounded">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded">{loading ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          )}

          {/* listagem */}
          {loading && !showForm ? (
            <div className="text-center py-12">Carregando...</div>
          ) : grupos.length === 0 && !showForm ? (
            <div className="text-center py-12 bg-white rounded-xl border">Nenhum grupo cadastrado</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grupos.map(grupo => (
                <div key={grupo.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{grupo.nome}</h3>
                      <p className="text-xs text-slate-500">{grupo.membros_count || 0} membro(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(grupo)} className="p-2 rounded hover:bg-slate-50"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(grupo.id)} className="p-2 rounded hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                      <button onClick={() => openGroupView(grupo)} className="p-2 rounded hover:bg-slate-50"><UsersRound className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">{(grupo as any).descricao || ''}</div>
                </div>
              ))}
            </div>
          )}

          {/* GROUP VIEW MODAL */}
          {showGroupView && viewingGroup && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl p-6 overflow-auto max-h-[90vh]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{viewingGroup.nome}</h3>
                    <p className="text-sm text-slate-500">ID: {viewingGroup.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={closeGroupView} className="px-3 py-2 border rounded">Fechar</button>
                  </div>
                </div>

                <div className="mt-4">
                  <nav className="flex gap-2 border-b pb-2">
                    <button onClick={() => setActiveTab('dados')} className={`px-3 py-2 rounded ${activeTab === 'dados' ? 'bg-slate-100' : ''}`}>Dados</button>
                    <button onClick={() => setActiveTab('membros')} className={`px-3 py-2 rounded ${activeTab === 'membros' ? 'bg-slate-100' : ''}`}>Membros</button>
                    <button onClick={() => setActiveTab('ocorrencias')} className={`px-3 py-2 rounded ${activeTab === 'ocorrencias' ? 'bg-slate-100' : ''}`}>Ocorrências</button>
                    <button onClick={() => setActiveTab('historico')} className={`px-3 py-2 rounded ${activeTab === 'historico' ? 'bg-slate-100' : ''}`}>Histórico</button>
                  </nav>

                  <div className="mt-4">
                    {activeTab === 'dados' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Descrição</p>
                          <div className="mt-2">{(viewingGroup as any).descricao || '—'}</div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Líderes</p>
                          <div className="mt-2 text-sm">
                            <div>Líder 1: {pessoas.find(p => p.id === (viewingGroup as any).lider_1_id)?.nome_completo || '—'}</div>
                            <div>Líder 2: {pessoas.find(p => p.id === (viewingGroup as any).lider_2_id)?.nome_completo || '—'}</div>
                            <div>Co-líder 1: {pessoas.find(p => p.id === (viewingGroup as any).co_lider_1_id)?.nome_completo || '—'}</div>
                            <div>Co-líder 2: {pessoas.find(p => p.id === (viewingGroup as any).co_lider_2_id)?.nome_completo || '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'membros' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Adicionar pessoas</h4>
                          <div className="flex gap-2 mb-2">
                            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar por nome" className="flex-1 px-3 py-2 border rounded" />
                            <button onClick={() => setMemberSearch('')} className="px-3 py-2 border rounded"><Search className="w-4 h-4" /></button>
                          </div>

                          <div className="max-h-64 overflow-auto border rounded p-2 space-y-2">
                            {memberSearchResults.map(p => (
                              <div key={p.id} className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{p.nome_completo}</div>
                                  <div className="text-xs text-slate-500">{p.telefone}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => addMemberToGroup(p, 'membro')} className="px-2 py-1 bg-blue-600 text-white rounded">Adicionar</button>
                                  <button onClick={() => addMemberToGroup(p, 'líder')} className="px-2 py-1 border rounded">Como líder</button>
                                </div>
                              </div>
                            ))}

                            {memberSearchResults.length === 0 && <div className="text-sm text-slate-500">Nenhuma pessoa disponível</div>}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Membros atuais</h4>
                          <div className="max-h-80 overflow-auto border rounded p-2 space-y-2">
                            {(viewingGroup.membros || []).map(m => (
                              <div key={m.id} className="flex items-center justify-between border-b py-2">
                                <div>
                                  <div className="font-medium">{m.nome_completo} <span className="text-xs text-slate-500">({m.papel_grupo || 'membro'})</span></div>
                                  <div className="text-xs text-slate-500">Entrada: {formatDate((m as any).data_entrada || (new Date()).toISOString())}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => openPessoaFicha(m)} title="Ver ficha" className="p-2 text-slate-600 hover:bg-slate-100 rounded"><Eye className="w-4 h-4" /></button>
                                  <button onClick={() => removeMemberFromGroup(m)} title="Remover" className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))}

                            {(!viewingGroup.membros || viewingGroup.membros.length === 0) && <div className="text-sm text-slate-500">Nenhum membro</div>}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ocorrencias' && (
                      <div>
                        <form onSubmit={addOcorrencia} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Tipo *</label>
                            <input value={ocorrenciaForm.tipo} onChange={e => setOcorrenciaForm(prev => ({ ...prev, tipo: e.target.value }))} className="w-full px-3 py-2 border rounded" placeholder="Ex: Visita" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Data *</label>
                            <input type="date" value={ocorrenciaForm.data} onChange={e => setOcorrenciaForm(prev => ({ ...prev, data: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Membro (opcional)</label>
                            <select value={ocorrenciaForm.pessoa_id} onChange={e => setOcorrenciaForm(prev => ({ ...prev, pessoa_id: e.target.value }))} className="w-full px-3 py-2 border rounded">
                              <option value="">Nenhum</option>
                              {(viewingGroup.membros || []).map(m => <option key={m.id} value={m.id}>{m.nome_completo}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Descrição</label>
                            <div className="flex gap-2">
                              <input value={ocorrenciaForm.descricao} onChange={e => setOcorrenciaForm(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                              <button className="px-3 py-2 bg-slate-800 text-white rounded">Adicionar</button>
                            </div>
                          </div>
                        </form>

                        <div className="space-y-2">
                          {ocorrencias.length === 0 ? <div className="text-sm text-slate-500 italic">Sem ocorrências</div> : (
                            ocorrencias.map(o => (
                              <div key={o.id} className="bg-slate-50 border rounded p-3 flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{o.tipo_ocorrencia_id} <span className="text-xs text-slate-500">— {o.data_ocorrencia}</span></div>
                                  {o.pessoa_id && <div className="text-xs text-slate-600">Membro: {pessoas.find(p => p.id === o.pessoa_id)?.nome_completo}</div>}
                                  {o.descricao && <div className="text-xs text-slate-600 mt-1">{o.descricao}</div>}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => deleteOcorrencia(o.id)} className="text-red-600">Remover</button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'historico' && (
                      <div>
                        {historicoGrupo.length === 0 ? <div className="text-sm text-slate-500 italic">Sem histórico</div> : (
                          <div className="space-y-2">
                            {historicoGrupo.map(h => (
                              <div key={h.id} className="flex items-start gap-3 p-2 border rounded">
                                <div className="text-xs text-slate-500 w-36">{formatDate(h.data)}</div>
                                <div>
                                  <div className="text-sm"><strong>{h.acao}</strong> — {pessoas.find(p => p.id === h.pessoa_id)?.nome_completo || 'Pessoa'}</div>
                                  {h.papel && <div className="text-xs text-slate-500">Papel: {h.papel}</div>}
                                  {h.nota && <div className="text-xs text-slate-500">{h.nota}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}

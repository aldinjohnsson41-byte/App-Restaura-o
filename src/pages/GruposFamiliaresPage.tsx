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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// =========================================
// GruposFamiliaresPage (rework completo)
// - Modal de visualização/gestão do grupo (abas: Dados, Membros, Ocorrências, Histórico)
// - Adicionar / remover membro grava entrada no histórico com data e papel
// - Líder / co-líder tratados como papéis especiais
// - Modal de pessoa (Ficha) com abas Dados e Histórico
// - Integração com Supabase (CRUD básico)
// =========================================

interface GruposFamiliaresPageProps {
  onBack: () => void;
}

type MembroHistorico = {
  id?: string;
  grupo_id?: string;
  pessoa_id?: string;
  acao: 'adicionado' | 'removido' | 'promovido' | 'rebaixado';
  papel?: string | null; // 'líder' | 'co-líder' | 'membro'
  data?: string; // ISO date
  nota?: string | null;
};

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();

  // lists
  const [grupos, setGrupos] = useState<GrupoFamiliar[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  // loading
  const [loading, setLoading] = useState(false);

  // form / modal state for create/edit
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GrupoFamiliar | null>(null);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    lider_1_id: '',
    lider_2_id: '',
    co_lider_1_id: '',
    co_lider_2_id: '',
    membros_ids: [] as string[]
  });

  // VIEW modal (visualizar grupo, com abas)
  const [viewingGroup, setViewingGroup] = useState<GrupoFamiliar | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'dados' | 'membros' | 'ocorrencias' | 'historico'>('dados');

  // pessoa modal
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Pessoa | null>(null);

  // search / add member in view
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<Pessoa[]>([]);

  // ocorrencias (per group)
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [ocorrenciaForm, setOcorrenciaForm] = useState({ tipo_ocorrencia_id: '', pessoa_id: '', data_ocorrencia: '', descricao: '' });

  // histórico do grupo (timeline)
  const [historico, setHistorico] = useState<MembroHistorico[]>([]);

  const [error, setError] = useState('');

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
      console.error('Erro ao buscar grupos', error);
      return;
    }
    setGrupos(data || []);
  }

  async function loadPessoas() {
    const { data, error } = await supabase.from('pessoas').select('id, nome_completo, telefone, email, grupo_familiar_id, papel_grupo').order('nome_completo');
    if (error) {
      console.error('Erro ao buscar pessoas', error);
      return;
    }
    setPessoas(data || []);
  }

  // ---------- CRUD Grupo (create/update) ----------
  function openNewForm() {
    setEditing(null);
    setForm({ nome: '', descricao: '', lider_1_id: '', lider_2_id: '', co_lider_1_id: '', co_lider_2_id: '', membros_ids: [] });
    setShowForm(true);
    setError('');
  }

  async function openEditForm(grupo: GrupoFamiliar) {
    setEditing(grupo);
    // carregar membros atuais
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

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');

    if (!form.nome.trim()) {
      setError('Nome do grupo é obrigatório');
      return;
    }

    const leaderIds = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean);
    const dup = leaderIds.some((id, idx) => leaderIds.indexOf(id) !== idx);
    if (dup) {
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

      // sincronizar membros: adicionar/remover e criar histórico
      const { data: currentMembersData } = await supabase.from('pessoas').select('id').eq('grupo_familiar_id', grupoId);
      const currentIds = (currentMembersData || []).map((m: any) => m.id);
      const newIds = form.membros_ids;

      const toAdd = newIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !newIds.includes(id));

      const nowISO = new Date().toISOString();

      for (const id of toAdd) {
        const papel = id === form.lider_1_id || id === form.lider_2_id ? 'líder' : id === form.co_lider_1_id || id === form.co_lider_2_id ? 'co-líder' : 'membro';
        await supabase.from('pessoas').update({ grupo_familiar_id: grupoId, papel_grupo: papel }).eq('id', id);

        // registrar histórico
        await supabase.from('grupo_membros_historico').insert({
          grupo_id: grupoId,
          pessoa_id: id,
          acao: 'adicionado',
          papel: papel,
          data: nowISO,
          nota: editing ? 'Adicionado via edição do grupo' : 'Adicionado ao criar grupo'
        });
      }

      for (const id of toRemove) {
        await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({
          grupo_id: grupoId,
          pessoa_id: id,
          acao: 'removido',
          papel: null,
          data: nowISO,
          nota: 'Removido via edição do grupo'
        });
      }

      // garantir papel correto para líderes/co-líderes (mesmo se não estavam na lista de membros_ids)
      const leaderSet = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean) as string[];
      for (const id of leaderSet) {
        const papel = id === form.lider_1_id || id === form.lider_2_id ? 'líder' : 'co-líder';
        await supabase.from('pessoas').update({ grupo_familiar_id: grupoId, papel_grupo: papel }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({
          grupo_id: grupoId,
          pessoa_id: id,
          acao: 'promovido',
          papel,
          data: nowISO,
          nota: 'Definido como líder / co-líder'
        });
      }

      // se estava editing, ajustar ex-líderes que perderam papel
      if (editing) {
        const prevLeaderIds = [ (editing as any).lider_1_id, (editing as any).lider_2_id, (editing as any).co_lider_1_id, (editing as any).co_lider_2_id ].filter(Boolean) as string[];
        for (const prev of prevLeaderIds) {
          if (!leaderSet.includes(prev)) {
            const stillMember = form.membros_ids.includes(prev);
            await supabase.from('pessoas').update({ papel_grupo: stillMember ? 'membro' : null }).eq('id', prev).eq('grupo_familiar_id', grupoId);
            await supabase.from('grupo_membros_historico').insert({
              grupo_id: grupoId,
              pessoa_id: prev,
              acao: 'rebaixado',
              papel: stillMember ? 'membro' : null,
              data: nowISO,
              nota: 'Perdeu posição de liderança'
            });
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

  // ---------- Delete ----------
  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm('Deseja realmente excluir este grupo? Isso removerá vínculo dos membros.')) return;
    setLoading(true);
    try {
      // limpar vínculo
      await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('grupo_familiar_id', id);
      // remover ocorrências vinculadas
      await supabase.from('ocorrencias').delete().eq('grupo_id', id);
      // remover histórico
      await supabase.from('grupo_membros_historico').delete().eq('grupo_id', id);
      // excluir grupo
      const { error } = await supabase.from('grupos_familiares').delete().eq('id', id);
      if (error) throw error;
      await loadGrupos();
      await loadPessoas();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao excluir grupo');
    } finally {
      setLoading(false);
    }
  }

  // ---------- VIEW modal (visualizar grupo) ----------
  async function openViewModal(grupo: GrupoFamiliar) {
    setViewingGroup(grupo);
    setActiveViewTab('dados');
    setShowViewModal(true);

    // carregar ocorrencias e historico
    const [{ data: ocorrs }, { data: hist }] = await Promise.all([
      supabase.from('ocorrencias').select('id, tipo_ocorrencia_id, pessoa_id, data_ocorrencia, descricao').eq('grupo_id', grupo.id).order('data_ocorrencia', { ascending: false }),
      supabase.from('grupo_membros_historico').select('*').eq('grupo_id', grupo.id).order('data', { ascending: false })
    ]);

    setOcorrencias(ocorrs || []);
    setHistorico(hist || []);
  }

  function closeViewModal() {
    setShowViewModal(false);
    setViewingGroup(null);
    setOcorrencias([]);
    setHistorico([]);
  }

  // search members for adding in view modal
  useEffect(() => {
    if (!memberSearchQuery) {
      setMemberSearchResults(pessoas.filter(p => p.grupo_familiar_id !== viewingGroup?.id));
      return;
    }
    const q = memberSearchQuery.toLowerCase();
    setMemberSearchResults(pessoas.filter(p => (p.nome_completo || '').toLowerCase().includes(q) && p.grupo_familiar_id !== viewingGroup?.id));
  }, [memberSearchQuery, pessoas, viewingGroup]);

  // add member from view modal
  async function addMemberToViewingGroup(pessoa: Pessoa, papel: string = 'membro') {
    if (!viewingGroup) return;
    setLoading(true);
    try {
      // set pessoa.group and papel
      await supabase.from('pessoas').update({ grupo_familiar_id: viewingGroup.id, papel_grupo: papel }).eq('id', pessoa.id);
      // historico
      await supabase.from('grupo_membros_historico').insert({ grupo_id: viewingGroup.id, pessoa_id: pessoa.id, acao: 'adicionado', papel, data: new Date().toISOString(), nota: 'Adicionado via modal de visualização' });
      // reload
      await loadPessoas();
      const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', viewingGroup.id).order('data', { ascending: false });
      setHistorico(hist || []);
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  }

  // remove member from view modal
  async function removeMemberFromViewingGroup(pessoa: Pessoa) {
    if (!viewingGroup) return;
    if (!confirm(`Remover ${pessoa.nome_completo} do grupo?`)) return;
    setLoading(true);
    try {
      await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', pessoa.id);
      await supabase.from('grupo_membros_historico').insert({ grupo_id: viewingGroup.id, pessoa_id: pessoa.id, acao: 'removido', papel: null, data: new Date().toISOString(), nota: 'Removido via modal de visualização' });
      await loadPessoas();
      const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', viewingGroup.id).order('data', { ascending: false });
      setHistorico(hist || []);
    } catch (e) {
      console.error(e);
      alert('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  }

  // open person modal (ficha)
  async function openPersonFicha(p: Pessoa) {
    setSelectedPerson(null);
    setShowPersonModal(true);
    const { data } = await supabase.from('pessoas').select('*').eq('id', p.id).single();
    setSelectedPerson(data || null);
  }

  function closePersonModal() {
    setShowPersonModal(false);
    setSelectedPerson(null);
  }

  // ocorrências (add)
  async function addOcorrencia(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!viewingGroup) return setError('Abra o grupo antes de adicionar ocorrência');
    if (!ocorrenciaForm.tipo_ocorrencia_id || !ocorrenciaForm.data_ocorrencia) return setError('Tipo e data são obrigatórios');
    setLoading(true);
    try {
      const payload = {
        tipo_ocorrencia_id: ocorrenciaForm.tipo_ocorrencia_id,
        pessoa_id: ocorrenciaForm.pessoa_id || null,
        data_ocorrencia: ocorrenciaForm.data_ocorrencia,
        descricao: ocorrenciaForm.descricao || null,
        grupo_id: viewingGroup.id
      };
      const { data, error } = await supabase.from('ocorrencias').insert(payload).select().single();
      if (error) throw error;
      setOcorrencias(prev => [data, ...prev]);
      setOcorrenciaForm({ tipo_ocorrencia_id: '', pessoa_id: '', data_ocorrencia: '', descricao: '' });
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

  // render
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-slate-700" /></button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">Gerencie células, líderes, membros, ocorrências e histórico</p>
        </div>
        {!showForm && (
          <button onClick={openNewForm} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Grupo</button>
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
                <button type="button" className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { setMemberSearchQuery(''); setShowViewModal(true); setViewingGroup(editing ? editing : ({ id: 'tmp', nome: form.nome } as any)); setActiveViewTab('membros'); }}><Plus className="w-4 h-4" /> Adicionar membro</button>
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
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, membros_ids: prev.membros_ids.filter(x => x !== id) }))} className="text-sm text-red-600">Remover</button>
                        <button type="button" onClick={() => openPersonFicha(p as Pessoa)} className="text-sm text-slate-700">Ficha</button>
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
          <button onClick={openNewForm} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Cadastrar Primeiro Grupo</button>
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
                    <p className="text-xs text-slate-500">ID: {grupo.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openEditForm(grupo)} title="Editar" className="p-2 rounded-md hover:bg-slate-50"><Edit className="w-4 h-4 text-slate-600" /></button>
                  <button onClick={() => handleDelete(grupo.id)} title="Excluir" className="p-2 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-600" /></button>
                  <button onClick={() => openViewModal(grupo)} title="Visualizar" className="p-2 rounded-md hover:bg-slate-50"><UsersRound className="w-4 h-4 text-slate-600" /></button>
                </div>
              </div>

              {(grupo as any).descricao && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{(grupo as any).descricao}</p>}

              <div className="space-y-2 mb-4">
                { (grupo as any).lider_1_id && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Líder:</span><span className="text-slate-900 font-medium">{pessoas.find(p => p.id === (grupo as any).lider_1_id)?.nome_completo}</span></div> }
                { (grupo as any).lider_2_id && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-slate-400" /><span className="text-slate-600">Líder 2:</span><span className="text-slate-900 font-medium">{pessoas.find(p => p.id === (grupo as any).lider_2_id)?.nome_completo}</span></div> }
                { !(grupo as any).lider_1_id && !(grupo as any).co_lider_1_id && <div className="flex items-center gap-2 text-sm text-slate-500 italic"><User className="w-4 h-4" />Sem liderança definida</div> }
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => openViewModal(grupo)} className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"><UsersRound className="w-4 h-4" /> Visualizar</button>
                <button onClick={() => openEditForm(grupo)} className="flex-1 px-3 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"><Edit className="w-4 h-4" /> Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-slate-600">Total: {grupos.length} grupo(s) familiar(es)</div>

      {/* ---------- VIEW MODAL ---------- */}
      {showViewModal && viewingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl p-4 rounded shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">{viewingGroup.nome}</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 border rounded" onClick={() => { setShowViewModal(false); setViewingGroup(null); }}>Fechar</button>
              </div>
            </div>

            <div className="border-b mb-4">
              <nav className="flex gap-2">
                <button onClick={() => setActiveViewTab('dados')} className={`px-3 py-2 ${activeViewTab === 'dados' ? 'bg-slate-100' : ''} rounded`}>Dados</button>
                <button onClick={() => setActiveViewTab('membros')} className={`px-3 py-2 ${activeViewTab === 'membros' ? 'bg-slate-100' : ''} rounded`}>Membros</button>
                <button onClick={() => setActiveViewTab('ocorrencias')} className={`px-3 py-2 ${activeViewTab === 'ocorrencias' ? 'bg-slate-100' : ''} rounded`}>Ocorrências</button>
                <button onClick={() => setActiveViewTab('historico')} className={`px-3 py-2 ${activeViewTab === 'historico' ? 'bg-slate-100' : ''} rounded`}>Histórico</button>
              </nav>
            </div>

            {activeViewTab === 'dados' && (
              <div className="space-y-3">
                <p className="text-sm"><strong>Descrição:</strong> {(viewingGroup as any).descricao || '—'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-600">Líder 1</p>
                    <p className="font-medium">{pessoas.find(p => p.id === (viewingGroup as any).lider_1_id)?.nome_completo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Líder 2</p>
                    <p className="font-medium">{pessoas.find(p => p.id === (viewingGroup as any).lider_2_id)?.nome_completo || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeViewTab === 'membros' && (
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <input value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} placeholder="Buscar pessoas para adicionar" className="flex-1 border px-3 py-2 rounded" />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setMemberSearchQuery('')}><Search /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-semibold mb-2">Adicionar</h4>
                    <div className="max-h-48 overflow-auto border rounded p-2 space-y-2">
                      {memberSearchResults.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{p.nome_completo}</div>
                            <div className="text-xs text-slate-500">{p.telefone}</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => addMemberToViewingGroup(p, 'membro')}>Adicionar</button>
                            <button className="px-2 py-1 border rounded" onClick={() => addMemberToViewingGroup(p, 'líder')}>Adicionar como Líder</button>
                          </div>
                        </div>
                      ))}

                      {memberSearchResults.length === 0 && <div className="text-sm text-slate-500">Nenhuma pessoa disponível</div>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Membros atuais</h4>
                    <div className="max-h-64 overflow-auto border rounded p-2 space-y-2">
                      {pessoas.filter(p => p.grupo_familiar_id === viewingGroup.id).map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{p.nome_completo} <span className="text-xs text-slate-500">({p.papel_grupo || 'membro'})</span></div>
                            <div className="text-xs text-slate-500">{p.telefone}</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-2 py-1 border rounded" onClick={() => openPersonFicha(p)}>Ficha</button>
                            <button className="px-2 py-1 text-red-600" onClick={() => removeMemberFromViewingGroup(p)}>Remover</button>
                          </div>
                        </div>
                      ))}

                      {pessoas.filter(p => p.grupo_familiar_id === viewingGroup.id).length === 0 && <div className="text-sm text-slate-500">Sem membros</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeViewTab === 'ocorrencias' && (
              <div className="space-y-4">
                <form onSubmit={addOcorrencia} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tipo *</label>
                    <input value={ocorrenciaForm.tipo_ocorrencia_id} onChange={e => setOcorrenciaForm(prev => ({ ...prev, tipo_ocorrencia_id: e.target.value }))} className="w-full px-3 py-2 border rounded" placeholder="Ex: Visita" />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Data *</label>
                    <input type="date" value={ocorrenciaForm.data_ocorrencia} onChange={e => setOcorrenciaForm(prev => ({ ...prev, data_ocorrencia: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Membro (opcional)</label>
                    <select value={ocorrenciaForm.pessoa_id} onChange={e => setOcorrenciaForm(prev => ({ ...prev, pessoa_id: e.target.value }))} className="w-full px-3 py-2 border rounded">
                      <option value="">Nenhum</option>
                      {pessoas.filter(p => p.grupo_familiar_id === viewingGroup.id).map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Descrição</label>
                    <div className="flex gap-2">
                      <input type="text" value={ocorrenciaForm.descricao} onChange={e => setOcorrenciaForm(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded" placeholder="Observação" />
                      <button className="px-3 py-2 bg-slate-800 text-white rounded">Adicionar</button>
                    </div>
                  </div>
                </form>

                <div className="space-y-2">
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

            {activeViewTab === 'historico' && (
              <div className="space-y-3">
                {historico.length === 0 ? <div className="text-sm text-slate-500 italic">Sem histórico</div> : (
                  <div className="space-y-2">
                    {historico.map(h => (
                      <div key={h.id} className="flex items-start gap-3 p-2 border rounded">
                        <div className="text-xs text-slate-500 w-28">{new Date(h.data || '').toLocaleString()}</div>
                        <div>
                          <div className="text-sm"><strong>{h.acao}</strong> — {pessoas.find(p => p.id === h.pessoa_id)?.nome_completo || 'Pessoa removida'}</div>
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
      )}

      {/* ---------- PERSON MODAL (Ficha) ---------- */}
      {showPersonModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl p-4 rounded shadow-lg overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Ficha: {selectedPerson.nome_completo}</h3>
              <button className="px-3 py-2 border rounded" onClick={closePersonModal}>Fechar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Dados</h4>
                <div className="space-y-2 mt-2">
                  <div><strong>Nome:</strong> {selectedPerson.nome_completo}</div>
                  <div><strong>Telefone:</strong> {selectedPerson.telefone || '—'}</div>
                  <div><strong>Email:</strong> {(selectedPerson as any).email || '—'}</div>
                  <div><strong>Grupo atual:</strong> {pessoas.find(p => p.id === selectedPerson.id)?.grupo_familiar_id || '—'}</div>
                  <div><strong>Papel:</strong> {selectedPerson.papel_grupo || '—'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Histórico</h4>
                <div className="max-h-64 overflow-auto border rounded p-2 mt-2 space-y-2">
                  {/* carregar histórico da pessoa (grupo_membros_historico) */}
                  {/* Para simplificar, vamos consultar localmente o histórico do grupo atual (já carregado na view). */}
                  {/* Em um refinamento eu traria apenas o histórico dessa pessoa via supabase.select(...). */}
                  <div className="text-sm text-slate-500">Histórico específico da pessoa disponível na aba Histórico do grupo.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

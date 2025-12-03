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

/**
 * Arquivo completo, incluindo o trecho final corrigido.
 */

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
  acao?: 'adicionado' | 'removido' | 'promovido' | 'rebaixado' | 'lider_alterado' | 'co_lider_alterado';
  papel?: string | null;
  data?: string | null;
  nota?: string | null;
};

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();

  const [grupos, setGrupos] = useState<GrupoWithCounts[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const [showGroupView, setShowGroupView] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<GrupoWithCounts | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'membros' | 'ocorrencias' | 'historico'>('dados');

  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<Pessoa[]>([]);
  const [showAddMemberPanel, setShowAddMemberPanel] = useState(false);

  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [ocorrenciaForm, setOcorrenciaForm] = useState({ tipo: '', pessoa_id: '', data: '', descricao: '' });

  const [historicoGrupo, setHistoricoGrupo] = useState<MembroHistorico[]>([]);
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);
  const [personViewOpen, setPersonViewOpen] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadGrupos(), loadPessoas()]);
    } finally {
      setLoading(false);
    }
  }

  async function loadGrupos() {
    const { data, error } = await supabase.from('grupos_familiares').select('*').order('nome');
    if (error) return setError('Erro ao carregar grupos');

    const gruposRaw = data || [];
    const gruposWithCounts = await Promise.all(
      gruposRaw.map(async g => {
        const { count } = await supabase.from('pessoas')
          .select('*', { head: true, count: 'exact' })
          .eq('grupo_familiar_id', g.id);
        return { ...g, membros_count: count || 0 };
      })
    );

    setGrupos(gruposWithCounts);
  }

  async function loadPessoas() {
    const { data, error } = await supabase.from('pessoas').select('*').order('nome_completo');
    if (error) return setError('Erro ao carregar pessoas');
    setPessoas(data || []);
  }

  function handleNew() {
    setEditing(null);
    setForm({ nome: '', descricao: '', lider_1_id: '', lider_2_id: '', co_lider_1_id: '', co_lider_2_id: '', membros_ids: [] });
    setShowForm(true);
  }

  async function handleEdit(grupo: GrupoWithCounts) {
    setEditing(grupo);
    const { data } = await supabase.from('pessoas').select('id').eq('grupo_familiar_id', grupo.id);
    const membros_ids = (data || []).map((m: any) => m.id);

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

    if (!form.nome.trim()) return setError('Nome é obrigatório');

    const leaderIds = [form.lider_1_id, form.lider_2_id, form.co_lider_1_id, form.co_lider_2_id].filter(Boolean);
    if (new Set(leaderIds).size !== leaderIds.length)
      return setError('Uma pessoa não pode ter dois cargos');

    setLoading(true);
    try {
      let grupoId;

      if (editing) {
        await supabase.from('grupos_familiares').update({
          nome: form.nome,
          descricao: form.descricao,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        }).eq('id', editing.id);

        grupoId = editing.id;
      } else {
        const { data } = await supabase.from('grupos_familiares').insert({
          nome: form.nome,
          descricao: form.descricao,
          lider_1_id: form.lider_1_id || null,
          lider_2_id: form.lider_2_id || null,
          co_lider_1_id: form.co_lider_1_id || null,
          co_lider_2_id: form.co_lider_2_id || null
        }).select().single();

        grupoId = data.id;
      }

      // sincronização de membros e histórico
      const { data: currentMembers } = await supabase.from('pessoas').select('id').eq('grupo_familiar_id', grupoId);
      const currentIds = (currentMembers || []).map((m: any) => m.id);
      const newIds = form.membros_ids;

      const toAdd = newIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      const now = new Date().toISOString();

      for (const id of toAdd) {
        const papel =
          id === form.lider_1_id || id === form.lider_2_id ? 'líder' :
          id === form.co_lider_1_id || id === form.co_lider_2_id ? 'co-líder' :
          'membro';

        await supabase.from('pessoas').update({ grupo_familiar_id: grupoId, papel_grupo: papel }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({
          grupo_id: grupoId,
          pessoa_id: id,
          acao: 'adicionado',
          papel,
          data: now,
          nota: 'Adicionado ao grupo'
        });
      }

      for (const id of toRemove) {
        await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', id);
        await supabase.from('grupo_membros_historico').insert({
          grupo_id: grupoId,
          pessoa_id: id,
          acao: 'removido',
          data: now,
          nota: 'Removido do grupo'
        });
      }

      await loadGrupos();
      await loadPessoas();
      setShowForm(false);
      setEditing(null);
      setError('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(grupoId?: string) {
    if (!grupoId) return;
    if (!confirm('Excluir grupo?')) return;

    setLoading(true);
    try {
      await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('grupo_familiar_id', grupoId);
      await supabase.from('ocorrencias').delete().eq('grupo_id', grupoId);
      await supabase.from('grupo_membros_historico').delete().eq('grupo_id', grupoId);
      await supabase.from('grupos_familiares').delete().eq('id', grupoId);

      await loadGrupos();
      await loadPessoas();
    } finally {
      setLoading(false);
    }
  }

  async function openGroupView(grupo: GrupoWithCounts) {
    setViewingGroup(grupo);
    setShowGroupView(true);
    setActiveTab('dados');

    const { data: membros } = await supabase.from('pessoas').select('*').eq('grupo_familiar_id', grupo.id);
    const { data: ocorrs } = await supabase.from('ocorrencias').select('*').eq('grupo_id', grupo.id).order('data_ocorrencia', { ascending: false });
    const { data: hist } = await supabase.from('grupo_membros_historico').select('*').eq('grupo_id', grupo.id).order('data', { ascending: false });

    setViewingGroup(prev => prev ? { ...prev, membros: membros || [] } : null);
    setOcorrencias(ocorrs || []);
    setHistoricoGrupo(hist || []);
  }

  function closeGroupView() {
    setShowGroupView(false);
    setViewingGroup(null);
    setActiveTab('dados');
    setMemberSearch('');
    setMemberSearchResults([]);
    setShowAddMemberPanel(false);
  }

  useEffect(() => {
    if (!memberSearch)
      setMemberSearchResults(pessoas.filter(p => p.grupo_familiar_id !== viewingGroup?.id));
    else {
      const q = memberSearch.toLowerCase();
      setMemberSearchResults(
        pessoas.filter(
          p => p.grupo_familiar_id !== viewingGroup?.id &&
          (p.nome_completo || '').toLowerCase().includes(q)
        )
      );
    }
  }, [memberSearch, pessoas, viewingGroup]);

  async function addMemberToGroup(pessoa: Pessoa, papel = 'membro') {
    if (!viewingGroup) return;

    const now = new Date().toISOString();
    await supabase.from('pessoas').update({
      grupo_familiar_id: viewingGroup.id,
      papel_grupo: papel
    }).eq('id', pessoa.id);

    await supabase.from('grupo_membros_historico').insert({
      grupo_id: viewingGroup.id,
      pessoa_id: pessoa.id,
      acao: 'adicionado',
      papel,
      data: now,
      nota: 'Adicionado via modal'
    });

    await openGroupView(viewingGroup);
    setShowAddMemberPanel(false);
    setMemberSearch('');
  }

  async function removeMemberFromGroup(person: Pessoa) {
    if (!viewingGroup) return;
    if (!confirm(`Remover ${person.nome_completo}?`)) return;

    const now = new Date().toISOString();

    await supabase.from('pessoas').update({ grupo_familiar_id: null, papel_grupo: null }).eq('id', person.id);
    await supabase.from('grupo_membros_historico').insert({
      grupo_id: viewingGroup.id,
      pessoa_id: person.id,
      acao: 'removido',
      data: now,
      nota: 'Removido via modal'
    });

    await openGroupView(viewingGroup);
  }

  function openPessoaFicha(person: Pessoa) {
    setSelectedPessoaId(person.id);
    setPersonViewOpen(true);
  }

  function closePessoaFicha() {
    setSelectedPessoaId(null);
    setPersonViewOpen(false);
  }

  function formatDate(date?: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleString();
  }

  function pessoaNomeById(id?: string | null) {
    return pessoas.find(p => p.id === id)?.nome_completo || '—';
  }

  // --------------------------------------------------------------------------
  // -------------------------------  UI  -------------------------------------
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Grupos Familiares</h2>
          <p className="text-slate-600 text-sm">Gerencie células, líderes e membros</p>
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

      {/* FICHA PESSOA */}
      {personViewOpen && selectedPessoaId && (
        <div className="p-4 bg-white rounded-xl border">
          <button
            onClick={closePessoaFicha}
            className="flex items-center gap-2 mb-4 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <PessoaDetails pessoaId={selectedPessoaId} onClose={closePessoaFicha} />
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {!personViewOpen && (
        <>
          {/* FORM DE CRIAÇÃO/EDIÇÃO */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">
                {editing ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
                  <input
                    value={form.nome}
                    onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>

                {/* Lideranças */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Líder 1', field: 'lider_1_id' },
                    { label: 'Líder 2', field: 'lider_2_id' },
                    { label: 'Co-líder 1', field: 'co_lider_1_id' },
                    { label: 'Co-líder 2', field: 'co_lider_2_id' }
                  ].map(({ label, field }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
                      <select
                        value={(form as any)[field]}
                        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-4 py-2 border rounded"
                      >
                        <option value="">Selecione...</option>
                        {pessoas.map(p => (
                          <option key={p.id} value={p.id}>{p.nome_completo}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Membros */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Membros</label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowGroupView(true);
                        setViewingGroup(editing || ({ id: 'tmp', nome: form.nome } as any));
                        setActiveTab('membros');
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Abrir Membros
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.membros_ids.length === 0 && (
                      <div className="text-sm text-slate-500 italic">Nenhum membro adicionado</div>
                    )}

                    {form.membros_ids.map(id => {
                      const p = pessoas.find(x => x.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between border p-2 rounded">
                          <div className="flex items-center gap-3">
                            <UsersRound className="w-5 h-5 text-orange-600" />
                            <div>
                              <div className="text-sm font-medium">{p?.nome_completo}</div>
                              <div className="text-xs text-slate-500">{(p as any)?.telefone}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-sm text-red-600"
                              onClick={() =>
                                setForm(prev => ({
                                  ...prev,
                                  membros_ids: prev.membros_ids.filter(x => x !== id)
                                }))
                              }
                            >
                              Remover
                            </button>

                            <button
                              type="button"
                              className="text-sm text-slate-700"
                              onClick={() => openPessoaFicha(p as Pessoa)}
                            >
                              Ficha
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setError('');
                    }}
                    className="px-4 py-2 border rounded"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LISTAGEM DE GRUPOS */}
          {!showForm && (
            <>
              {loading ? (
                <div className="text-center py-12">Carregando...</div>
              ) : grupos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border">
                  Nenhum grupo cadastrado
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grupos.map(grupo => (
                    <div
                      key={grupo.id}
                      className="bg-white border rounded-xl p-4 shadow-sm hover:shadow transition"
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{grupo.nome}</h3>
                          <p className="text-sm text-slate-600">
                            {grupo.membros_count} membro(s)
                          </p>
                        </div>

                        <UsersRound className="w-8 h-8 text-orange-600" />
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => openGroupView(grupo)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>

                        <button
                          onClick={() => handleEdit(grupo)}
                          className="px-3 py-2 bg-slate-200 text-slate-800 rounded text-sm flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(grupo.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded text-sm flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* MODAL DE VISUALIZAÇÃO */}
          {showGroupView && viewingGroup && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-4xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
                
                {/* Header modal */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{viewingGroup.nome}</h3>
                  <button
                    onClick={closeGroupView}
                    className="p-2 rounded hover:bg-slate-100"
                  >
                    <X className="w-5 h-5 text-slate-700" />
                  </button>
                </div>

                {/* Abas */}
                <div className="flex gap-4 border-b mb-4 pb-2">
                  {[
                    ['dados', 'Dados'],
                    ['membros', 'Membros'],
                    ['ocorrencias', 'Ocorrências'],
                    ['historico', 'Histórico']
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`pb-2 ${
                        activeTab === key
                          ? 'border-b-2 border-orange-600 text-orange-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* TAB: DADOS DO GRUPO */}
                {activeTab === 'dados' && (
                  <div className="space-y-4">
                    <p><strong>Líder 1:</strong> {pessoaNomeById((viewingGroup as any).lider_1_id)}</p>
                    <p><strong>Líder 2:</strong> {pessoaNomeById((viewingGroup as any).lider_2_id)}</p>
                    <p><strong>Co-líder 1:</strong> {pessoaNomeById((viewingGroup as any).co_lider_1_id)}</p>
                    <p><strong>Co-líder 2:</strong> {pessoaNomeById((viewingGroup as any).co_lider_2_id)}</p>

                    <p><strong>Descrição:</strong></p>
                    <p className="whitespace-pre-wrap">{(viewingGroup as any).descricao || '—'}</p>
                  </div>
                )}

                {/* TAB: MEMBROS */}
                {activeTab === 'membros' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">
                        Membros ({viewingGroup.membros?.length || 0})
                      </h4>

                      <button
                        onClick={() => setShowAddMemberPanel(true)}
                        className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>

                    {/* Lista */}
                    <div className="space-y-2">
                      {viewingGroup.membros?.map(m => (
                        <div
                          key={m.id}
                          className="p-3 border rounded flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{m.nome_completo}</div>
                            <div className="text-sm text-slate-600">{m.papel_grupo}</div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => openPessoaFicha(m)}
                              className="px-3 py-1 bg-slate-200 rounded text-sm"
                            >
                              Ficha
                            </button>
                            <button
                              onClick={() => removeMemberFromGroup(m)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!viewingGroup.membros || viewingGroup.membros.length === 0) && (
                        <div className="text-slate-500 text-sm italic">Nenhum membro</div>
                      )}
                    </div>

                    {/* Painel adicionar */}
                    {showAddMemberPanel && (
                      <div className="border p-4 rounded bg-slate-50">
                        <h4 className="text-md font-semibold mb-3">Adicionar Membro</h4>

                        <input
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          placeholder="Buscar pessoa..."
                          className="w-full px-3 py-2 border rounded mb-3"
                        />

                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {memberSearchResults.map(p => (
                            <div
                              key={p.id}
                              className="p-2 border rounded flex items-center justify-between"
                            >
                              <div>
                                <div>{p.nome_completo}</div>
                                <div className="text-xs text-slate-500">
                                  {p.telefone}
                                </div>
                              </div>

                              <button
                                onClick={() => addMemberToGroup(p)}
                                className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
                              >
                                Adicionar
                              </button>
                            </div>
                          ))}

                          {memberSearchResults.length === 0 && (
                            <div className="text-sm text-slate-500 italic">Nenhum resultado</div>
                          )}
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => setShowAddMemberPanel(false)}
                            className="px-3 py-1 bg-slate-700 text-white rounded"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: OCORRÊNCIAS */}
                {activeTab === 'ocorrencias' && (
                  <div className="space-y-4">
                    <form onSubmit={async e => { e.preventDefault(); await addOcorrencia(e); }} className="space-y-3">
                      <h4 className="text-lg font-semibold">Nova Ocorrência</h4>

                      <select
                        value={ocorrenciaForm.tipo}
                        onChange={e => setOcorrenciaForm(prev => ({ ...prev, tipo: e.target.value }))}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="">Tipo...</option>
                        <option value="1">Aviso</option>
                        <option value="2">Problema</option>
                        <option value="3">Outro</option>
                      </select>

                      <input
                        type="date"
                        value={ocorrenciaForm.data}
                        onChange={e => setOcorrenciaForm(prev => ({ ...prev, data: e.target.value }))}
                        className="w-full px-3 py-2 border rounded"
                      />

                      <textarea
                        value={ocorrenciaForm.descricao}
                        onChange={e => setOcorrenciaForm(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descrição"
                        className="w-full px-3 py-2 border rounded"
                      />

                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-600 text-white rounded"
                      >
                        Adicionar
                      </button>
                    </form>

                    <div className="border-t pt-4 space-y-2">
                      {ocorrencias.map(o => (
                        <div key={o.id} className="p-3 border rounded">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">Tipo: {o.tipo_ocorrencia_id}</div>
                              <div className="text-sm text-slate-600">
                                {formatDate(o.data_ocorrencia)}
                              </div>
                              <div className="mt-1">{o.descricao}</div>
                            </div>

                            <button
                              onClick={() => deleteOcorrencia(o.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}

                      {ocorrencias.length === 0 && (
                        <div className="text-sm text-slate-500 italic">Nenhuma ocorrência</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: HISTÓRICO */}
                {activeTab === 'historico' && (
                  <div className="space-y-3">
                    {historicoGrupo.map(h => (
                      <div key={h.id} className="p-3 border rounded">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-semibold">
                              {h.acao} — {h.papel || '—'}
                            </div>
                            <div className="text-sm text-slate-600">{pessoaNomeById(h.pessoa_id)}</div>
                            <div className="text-sm">{h.nota}</div>
                          </div>

                          <div className="text-xs text-slate-500">{formatDate(h.data)}</div>
                        </div>
                      </div>
                    ))}

                    {historicoGrupo.length === 0 && (
                      <div className="text-sm text-slate-500 italic">Nenhum registro</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

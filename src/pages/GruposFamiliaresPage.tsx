// src/pages/GruposFamiliaresPage.tsx
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
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
  grupo_familiar_id: string;
  tipo: string;
  observacao?: string | null;
  data: string;
  pessoa_id?: string | null;
  pessoa?: Pessoa | null;
}

export default function GruposFamiliaresPage({ onBack }: GruposFamiliaresPageProps) {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoWithDetails[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoWithDetails | null>(null);
  const [error, setError] = useState('');

  // Form data agora acomoda até 2 líderes, 2 co-líderes e membros múltiplos
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    lider_1_id: '',
    lider_2_id: '',
    co_lider_1_id: '',
    co_lider_2_id: '',
    membros_ids: [] as string[],
  });

  // ocorrências para o grupo em edição
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [ocorrenciaForm, setOcorrenciaForm] = useState({
    tipo: '',
    observacao: '',
    data: '',
    pessoa_id: '',
  });
  const [tiposOcorrencia, setTiposOcorrencia] = useState<string[]>([
    'Reunião',
    'Visita',
    'Acompanhamento',
    'Outro'
  ]);

  useEffect(() => {
    loadGrupos();
    loadPessoas();
    loadTiposOcorrencia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTiposOcorrencia = async () => {
    // tenta buscar em uma tabela 'ocorrencia_tipos' caso exista
    try {
      const { data, error } = await supabase.from('ocorrencia_tipos').select('nome').order('nome');
      if (!error && data) {
        const list = data.map((r: any) => r.nome).filter(Boolean);
        if (list.length) setTiposOcorrencia(list);
      }
    } catch (e) {
      // keep defaults
    }
  };

  const loadPessoas = async () => {
    const { data } = await supabase
      .from('pessoas')
      .select('id, nome_completo, grupo_familiar_id, telefone')
      .order('nome_completo');

    if (data) setPessoas(data);
  };

  const loadGrupos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('grupos_familiares')
      .select(`
        *,
        lider_1:lider_1_id(id, nome_completo, telefone),
        lider_2:lider_2_id(id, nome_completo, telefone),
        co_lider_1:co_lider_1_id(id, nome_completo, telefone),
        co_lider_2:co_lider_2_id(id, nome_completo, telefone)
      `)
      .order('nome');

    if (data && !error) {
      const gruposWithMembros = await Promise.all(
        data.map(async (grupo: any) => {
          const { count } = await supabase
            .from('pessoas')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_familiar_id', grupo.id);

          return {
            ...grupo,
            lider_1: Array.isArray(grupo.lider_1) ? grupo.lider_1[0] : grupo.lider_1,
            lider_2: Array.isArray(grupo.lider_2) ? grupo.lider_2[0] : grupo.lider_2,
            co_lider_1: Array.isArray(grupo.co_lider_1) ? grupo.co_lider_1[0] : grupo.co_lider_1,
            co_lider_2: Array.isArray(grupo.co_lider_2) ? grupo.co_lider_2[0] : grupo.co_lider_2,
            membros_count: count || 0,
          } as GrupoWithDetails;
        })
      );

      setGrupos(gruposWithMembros);
    }

    setLoading(false);
  };

  const handleNew = () => {
    setEditingGrupo(null);
    setFormData({
      nome: '',
      descricao: '',
      lider_1_id: '',
      lider_2_id: '',
      co_lider_1_id: '',
      co_lider_2_id: '',
      membros_ids: [],
    });
    setOcorrencias([]);
    setShowForm(true);
    setError('');
  };

  const handleEdit = async (grupo: GrupoWithDetails) => {
    setEditingGrupo(grupo);
    // carregar membros atuais
    const { data: membros } = await supabase
      .from('pessoas')
      .select('id, nome_completo, telefone')
      .eq('grupo_familiar_id', grupo.id)
      .order('nome_completo');

    const membrosIds = (membros || []).map((m: any) => m.id);

    // carregar ocorrências daquele grupo
    const { data: ocorrs } = await supabase
      .from('ocorrencias')
      .select('id, tipo, observacao, data, pessoa_id, pessoa: pessoa_id (id, nome_completo)')
      .eq('grupo_familiar_id', grupo.id)
      .order('data', { ascending: false });

    setOcorrencias((ocorrs || []).map((o: any) => ({
      id: o.id,
      grupo_familiar_id: grupo.id,
      tipo: o.tipo,
      observacao: o.observacao,
      data: o.data,
      pessoa_id: o.pessoa_id,
      pessoa: o.pessoa ? o.pessoa[0] : null,
    })));

    setFormData({
      nome: grupo.nome,
      descricao: grupo.descricao || '',
      lider_1_id: grupo.lider_1 ? (grupo.lider_1 as any).id : '',
      lider_2_id: grupo.lider_2 ? (grupo.lider_2 as any).id : '',
      co_lider_1_id: grupo.co_lider_1 ? (grupo.co_lider_1 as any).id : '',
      co_lider_2_id: grupo.co_lider_2 ? (grupo.co_lider_2 as any).id : '',
      membros_ids: membrosIds,
    });

    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // validações: não permitir líderes/co-líderes duplicados
    const leaders = [
      formData.lider_1_id,
      formData.lider_2_id,
      formData.co_lider_1_id,
      formData.co_lider_2_id,
    ].filter(Boolean);

    const duplicates = leaders.some((id, idx) => leaders.indexOf(id) !== idx);
    if (duplicates) {
      setError('Uma mesma pessoa não pode ocupar mais de um papel de liderança.');
      return;
    }

    setLoading(true);

    try {
      const grupoData = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        lider_1_id: formData.lider_1_id || null,
        lider_2_id: formData.lider_2_id || null,
        co_lider_1_id: formData.co_lider_1_id || null,
        co_lider_2_id: formData.co_lider_2_id || null,
      };

      if (editingGrupo) {
        // atualizar grupo
        const { error: updateError } = await supabase
          .from('grupos_familiares')
          .update(grupoData)
          .eq('id', editingGrupo.id);

        if (updateError) throw updateError;

        // Atualizar papéis das pessoas:
        // - Primeiro: resetar papéis anteriores que mudaram
        const prevLeaderIds = [
          editingGrupo.lider_1?.id,
          editingGrupo.lider_2?.id,
          editingGrupo.co_lider_1?.id,
          editingGrupo.co_lider_2?.id
        ].filter(Boolean) as string[];

        // Se alguma pessoa deixou de ser líder/co-líder, manter como membro (papel 'membro') se ainda estiver no grupo,
        // ou limpar papel se não estiver mais no grupo.
        for (const prevId of prevLeaderIds) {
          if (!leaders.includes(prevId)) {
            // se essa pessoa ainda está no grupo (membros_ids contém), deixamos papel 'membro', senão null
            const isStillMember = formData.membros_ids.includes(prevId);
            await supabase
              .from('pessoas')
              .update({ papel_grupo: isStillMember ? 'membro' : null })
              .eq('id', prevId)
              .eq('grupo_familiar_id', editingGrupo.id);
          }
        }

        // Agora definir líderes/co-líderes atuais
        const setPapel = async (id: string | undefined, papel: string) => {
          if (!id) return;
          await supabase
            .from('pessoas')
            .update({ grupo_familiar_id: editingGrupo.id, papel_grupo: papel })
            .eq('id', id);
        };

        await setPapel(formData.lider_1_id || undefined, 'líder');
        await setPapel(formData.lider_2_id || undefined, 'líder');
        await setPapel(formData.co_lider_1_id || undefined, 'co-líder');
        await setPapel(formData.co_lider_2_id || undefined, 'co-líder');

        // Atualizar membros: adicionar novos e remover antigos
        const { data: oldMembros } = await supabase
          .from('pessoas')
          .select('id')
          .eq('grupo_familiar_id', editingGrupo.id);

        const oldIds = (oldMembros || []).map((m: any) => m.id);
        const newIds = formData.membros_ids;

        const idsToAdd = newIds.filter(id => !oldIds.includes(id));
        const idsToRemove = oldIds.filter(id => !newIds.includes(id));

        // adicionar membros
        for (const id of idsToAdd) {
          // não sobrescrever papel se a pessoa é líder/co-líder (já definido)
          const isLeader = leaders.includes(id);
          await supabase
            .from('pessoas')
            .update({ grupo_familiar_id: editingGrupo.id, papel_grupo: isLeader ? undefined : 'membro' })
            .eq('id', id);
        }

        // remover membros
        for (const id of idsToRemove) {
          // se removed id era líder/co-líder, já tratamos acima; aqui limpamos grupo/papel
          await supabase
            .from('pessoas')
            .update({ grupo_familiar_id: null, papel_grupo: null })
            .eq('id', id);
        }
      } else {
        // inserir novo grupo
        const { data: newGrupo, error: insertError } = await supabase
          .from('grupos_familiares')
          .insert(grupoData)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!newGrupo) throw new Error('Erro ao criar grupo');

        const grupoId = newGrupo.id;

        // definir líderes/co-líderes
        const setPapelNew = async (id: string | undefined, papel: string) => {
          if (!id) return;
          await supabase
            .from('pessoas')
            .update({ grupo_familiar_id: grupoId, papel_grupo: papel })
            .eq('id', id);
        };

        await setPapelNew(formData.lider_1_id || undefined, 'líder');
        await setPapelNew(formData.lider_2_id || undefined, 'líder');
        await setPapelNew(formData.co_lider_1_id || undefined, 'co-líder');
        await setPapelNew(formData.co_lider_2_id || undefined, 'co-líder');

        // definir membros selecionados
        for (const id of formData.membros_ids) {
          // se for líder/co-líder já definido, não sobrescrever papel
          const isLeader = leaders.includes(id);
          await supabase
            .from('pessoas')
            .update({ grupo_familiar_id: grupoId, papel_grupo: isLeader ? undefined : 'membro' })
            .eq('id', id);
        }
      }

      setShowForm(false);
      setFormData({
        nome: '',
        descricao: '',
        lider_1_id: '',
        lider_2_id: '',
        co_lider_1_id: '',
        co_lider_2_id: '',
        membros_ids: [],
      });
      setEditingGrupo(null);
      await loadPessoas();
      await loadGrupos();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar grupo familiar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este grupo familiar?')) return;

    setLoading(true);
    try {
      // limpar pessoas do grupo
      await supabase
        .from('pessoas')
        .update({ grupo_familiar_id: null, papel_grupo: null })
        .eq('grupo_familiar_id', id);

      // remover ocorrências vinculadas
      await supabase.from('ocorrencias').delete().eq('grupo_familiar_id', id);

      // excluir grupo
      const { error } = await supabase.from('grupos_familiares').delete().eq('id', id);

      if (!error) {
        await loadPessoas();
        await loadGrupos();
      } else {
        alert('Erro ao excluir grupo familiar');
      }
    } catch (e) {
      alert('Erro ao excluir grupo familiar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGrupo(null);
    setFormData({
      nome: '',
      descricao: '',
      lider_1_id: '',
      lider_2_id: '',
      co_lider_1_id: '',
      co_lider_2_id: '',
      membros_ids: [],
    });
    setError('');
    setOcorrencias([]);
  };

  // Helpers para selects: não mostrar a mesma pessoa em duas posições (por exemplo se já está em lider_1 não mostrar em lider_2)
  const getPessoasDisponiveis = (tipo: string) => {
    // tipo pode ser 'lider_1', 'lider_2', 'co_lider_1', 'co_lider_2' ou 'membros'
    const selectedIds = [
      formData.lider_1_id,
      formData.lider_2_id,
      formData.co_lider_1_id,
      formData.co_lider_2_id,
    ].filter(Boolean);

    if (tipo === 'membros') {
      // membros podem incluir líderes também (mas se a pessoa for líder, ela já está automaticamente no grupo)
      return pessoas;
    }

    // Ao selecionar lider_1 por exemplo, queremos excluir o id selecionado nas outras leadership selects
    return pessoas.filter((p) => {
      // permitir a pessoa atual (ex.: ao editar, o select deve mostrar o valor atual)
      const currentValue =
        tipo === 'lider_1' ? formData.lider_1_id
          : tipo === 'lider_2' ? formData.lider_2_id
          : tipo === 'co_lider_1' ? formData.co_lider_1_id
          : tipo === 'co_lider_2' ? formData.co_lider_2_id : '';

      if (p.id === currentValue) return true;
      return !selectedIds.includes(p.id);
    });
  };

  // OCORRÊNCIAS
  const addOcorrencia = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingGrupo) {
      setError('Salve o grupo antes de adicionar ocorrências.');
      return;
    }

    if (!ocorrenciaForm.tipo || !ocorrenciaForm.data) {
      setError('Tipo e data da ocorrência são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        grupo_familiar_id: editingGrupo.id,
        tipo: ocorrenciaForm.tipo,
        observacao: ocorrenciaForm.observacao || null,
        data: ocorrenciaForm.data,
        pessoa_id: ocorrenciaForm.pessoa_id || null,
      };

      const { data: newOc, error } = await supabase
        .from('ocorrencias')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // anexar pessoa (opcional)
      let pessoaObj = null;
      if (newOc.pessoa_id) {
        const p = pessoas.find((x) => x.id === newOc.pessoa_id);
        pessoaObj = p || null;
      }

      setOcorrencias([{ ...(newOc as any), pessoa: pessoaObj }, ...ocorrencias]);
      setOcorrenciaForm({ tipo: '', observacao: '', data: '', pessoa_id: '' });
    } catch (err: any) {
      setError(err?.message || 'Erro ao adicionar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const removeOcorrencia = async (id?: string) => {
    if (!id) return;
    if (!confirm('Remover esta ocorrência?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
      if (!error) {
        setOcorrencias(ocorrencias.filter(o => o.id !== id));
      } else {
        alert('Erro ao remover ocorrência');
      }
    } catch (e) {
      alert('Erro ao remover ocorrência');
    } finally {
      setLoading(false);
    }
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
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Informações sobre o grupo, localização, horário de reunião..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Líderes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Líder 1
                </label>
                <select
                  value={formData.lider_1_id}
                  onChange={(e) => setFormData({ ...formData, lider_1_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('lider_1').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Líder 2 (opcional)
                </label>
                <select
                  value={formData.lider_2_id}
                  onChange={(e) => setFormData({ ...formData, lider_2_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('lider_2').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Co-líder 1
                </label>
                <select
                  value={formData.co_lider_1_id}
                  onChange={(e) => setFormData({ ...formData, co_lider_1_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('co_lider_1').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Co-líder 2 (opcional)
                </label>
                <select
                  value={formData.co_lider_2_id}
                  onChange={(e) => setFormData({ ...formData, co_lider_2_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecione...</option>
                  {getPessoasDisponiveis('co_lider_2').map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Membros - multi select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Membros (segure Ctrl/Cmd para selecionar múltiplos)
              </label>
              <select
                multiple
                value={formData.membros_ids}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFormData({ ...formData, membros_ids: selected });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                size={6}
              >
                {getPessoasDisponiveis('membros').map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome_completo} {pessoa.grupo_familiar_id ? `(em grupo)` : ''}
                  </option>
                ))}
              </select>
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

          {/* Seção de ocorrências (aparece somente ao editar um grupo já salvo) */}
          {editingGrupo && (
            <div className="mt-6 border-t pt-6 space-y-4">
              <h4 className="font-semibold text-slate-800">Ocorrências do grupo</h4>

              <form onSubmit={addOcorrencia} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Tipo *</label>
                  <select
                    value={ocorrenciaForm.tipo}
                    onChange={(e) => setOcorrenciaForm({ ...ocorrenciaForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {tiposOcorrencia.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Data *</label>
                  <input
                    type="date"
                    value={ocorrenciaForm.data}
                    onChange={(e) => setOcorrenciaForm({ ...ocorrenciaForm, data: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Membro (opcional)</label>
                  <select
                    value={ocorrenciaForm.pessoa_id}
                    onChange={(e) => setOcorrenciaForm({ ...ocorrenciaForm, pessoa_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Nenhum</option>
                    {/* listar membros atuais do grupo */}
                    {pessoas
                      .filter(p => p.grupo_familiar_id === editingGrupo.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.nome_completo}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Observação</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ocorrenciaForm.observacao}
                      onChange={(e) => setOcorrenciaForm({ ...ocorrenciaForm, observacao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="Observação curta"
                    />
                    <button
                      onClick={(e) => addOcorrencia(e)}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                {ocorrencias.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">Sem ocorrências registradas</div>
                ) : (
                  ocorrencias.map((o) => (
                    <div key={o.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{o.tipo} <span className="text-xs text-slate-500"> — {o.data}</span></div>
                        {o.pessoa && <div className="text-xs text-slate-600">Membro: {o.pessoa.nome_completo}</div>}
                        {o.observacao && <div className="text-xs text-slate-600 mt-1">{o.observacao}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeOcorrencia(o.id)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(grupo)}
                    title="Editar"
                    className="p-2 rounded-md hover:bg-slate-50"
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(grupo.id)}
                    title="Excluir"
                    className="p-2 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {grupo.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {grupo.descricao}
                </p>
              )}

              <div className="space-y-2 mb-4">
                {/* Líderes / co-líderes */}
                <div className="text-sm">
                  {grupo.lider_1 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Líder:</span>
                      <span className="text-slate-900 font-medium">{(grupo.lider_1 as any).nome_completo}</span>
                    </div>
                  )}
                  {grupo.lider_2 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Líder 2:</span>
                      <span className="text-slate-900 font-medium">{(grupo.lider_2 as any).nome_completo}</span>
                    </div>
                  )}
                  {grupo.co_lider_1 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Co-líder:</span>
                      <span className="text-slate-900 font-medium">{(grupo.co_lider_1 as any).nome_completo}</span>
                    </div>
                  )}
                  {grupo.co_lider_2 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Co-líder 2:</span>
                      <span className="text-slate-900 font-medium">{(grupo.co_lider_2 as any).nome_completo}</span>
                    </div>
                  )}
                  {!grupo.lider_1 && !grupo.co_lider_1 && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 italic">
                      <User className="w-4 h-4" />
                      Sem liderança definida
                    </div>
                  )}
                </div>
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

// components/GruposFamiliares/GrupoViewModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import { supabase, Pessoa } from '../../lib/supabase';
import {
  GrupoWithCounts,
  TabType,
  LeadershipField,
  MembroHistorico,
  Ocorrencia,
  OcorrenciaForm
} from '../../types/grupos';
import DadosTab from './Tabs/DadosTab';
import MembrosTab from './Tabs/MembrosTab';
import OcorrenciasTab from './Tabs/OcorrenciasTab';
import EventosTab from './Tabs/EventosTab';
import HistoricoTab from './Tabs/HistoricoTab';

interface GrupoViewModalProps {
  grupo: GrupoWithCounts | null;
  pessoas: Pessoa[];
  onClose: () => void;
  onEdit: () => void;
  onReload: () => void;
  onViewPessoa: (pessoa: Pessoa) => void;
}

export default function GrupoViewModal({
  grupo,
  pessoas,
  onClose,
  onEdit,
  onReload,
  onViewPessoa
}: GrupoViewModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [membros, setMembros] = useState<Pessoa[]>([]);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [historico, setHistorico] = useState<MembroHistorico[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [grupoAtualizado, setGrupoAtualizado] = useState<GrupoWithCounts | null>(grupo);

  // Carregar dados quando o modal abre ou quando o grupo muda
  useEffect(() => {
    if (grupo?.id) {
      setGrupoAtualizado(grupo);
      loadGrupoData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo?.id]);

  const loadGrupoData = async () => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      // Recarregar dados do grupo
      const { data: grupoData } = await supabase
        .from('grupos_familiares')
        .select('*')
        .eq('id', grupo.id)
        .single();

      if (grupoData) {
        setGrupoAtualizado({ ...grupoData, membros_count: grupo.membros_count });
      }

      const { data: membrosData } = await supabase
        .from('pessoas')
        .select('*')
        .eq('grupo_familiar_id', grupo.id)
        .order('nome_completo');

      // Usar a nova tabela grupo_ocorrencias
      const { data: ocorrsData } = await supabase
        .from('grupo_ocorrencias')
        .select('*')
        .eq('grupo_id', grupo.id)
        .order('data_ocorrencia', { ascending: false });

      const { data: histData } = await supabase
        .from('grupo_membros_historico')
        .select('*')
        .eq('grupo_id', grupo.id)
        .order('data', { ascending: false });

      // Carregar eventos
      const { data: eventosData } = await supabase
        .from('grupo_eventos')
        .select('*')
        .eq('grupo_id', grupo.id)
        .order('data_inicio', { ascending: true });

      setMembros(membrosData || []);
      setOcorrencias(ocorrsData || []);
      setHistorico(histData || []);
      setEventos(eventosData || []);
    } catch (e) {
      console.error('Erro ao carregar dados do grupo:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (pessoa: Pessoa, papel: string) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      await supabase
        .from('pessoas')
        .update({
          grupo_familiar_id: grupo.id,
          papel_grupo: papel
        })
        .eq('id', pessoa.id);

      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupo.id,
        pessoa_id: pessoa.id,
        acao: 'adicionado',
        papel,
        data: now,
        nota: `Membro ${pessoa.nome_completo} adicionado`
      });

      await loadGrupoData();
      onReload();
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (pessoa: Pessoa) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      await supabase
        .from('pessoas')
        .update({
          grupo_familiar_id: null,
          papel_grupo: null
        })
        .eq('id', pessoa.id);

      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupo.id,
        pessoa_id: pessoa.id,
        acao: 'removido',
        papel: null,
        data: now,
        nota: 'Removido via modal'
      });

      await loadGrupoData();
      onReload();
    } catch (e) {
      console.error(e);
      alert('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeLeadership = async (
    field: LeadershipField,
    pessoaId: string,
    data: string,
    observacao: string
  ) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      const prevValue = (grupo as any)[field];
      const prevName = pessoas.find((p) => p.id === prevValue)?.nome_completo || 'Ninguém';
      const newName = pessoaId ? (pessoas.find((p) => p.id === pessoaId)?.nome_completo || 'Desconhecido') : 'Ninguém';

      // Atualizar a tabela grupos_familiares
      const { data: updatedGrupo, error: updateError } = await supabase
        .from('grupos_familiares')
        .update({ [field]: pessoaId || null })
        .eq('id', grupo.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Se foi definida nova liderança, atualizar pessoa
      if (pessoaId) {
        const papel = field.startsWith('co_') ? 'co-líder' : 'líder';
        await supabase
          .from('pessoas')
          .update({
            grupo_familiar_id: grupo.id,
            papel_grupo: papel
          })
          .eq('id', pessoaId);
      }

      // Se havia liderança anterior e foi alterada, rebaixar
      if (prevValue && prevValue !== pessoaId) {
        const { data: stillMember } = await supabase
          .from('pessoas')
          .select('id')
          .eq('id', prevValue)
          .eq('grupo_familiar_id', grupo.id)
          .single();

        const papelNovo = stillMember ? 'membro' : null;
        await supabase.from('pessoas').update({
          papel_grupo: papelNovo
        }).eq('id', prevValue);
      }

      // Registrar no histórico com data e observação personalizadas
      const labelField = field.replace('_id', '').replace('_', ' ');
      const descricaoCompleta = `Alteração de ${labelField}: ${prevName} → ${newName}${observacao ? `. ${observacao}` : ''}`;

      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupo.id,
        pessoa_id: pessoaId || prevValue || null,
        acao: field.startsWith('co_') ? 'co_lider_alterado' : 'lider_alterado',
        papel: field.startsWith('co_') ? 'co-líder' : 'líder',
        data: data,
        nota: descricaoCompleta
      });

      // Recarregar todos os dados do grupo
      await loadGrupoData();

      // Recarregar a lista de grupos na página principal
      onReload();
    } catch (e) {
      console.error(e);
      alert('Erro ao alterar liderança');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleAddOcorrencia = async (form: OcorrenciaForm) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      // Inserir na nova tabela grupo_ocorrencias
      const { data, error } = await supabase
        .from('grupo_ocorrencias')
        .insert({
          grupo_id: grupo.id,
          tipo: form.tipo,
          data_ocorrencia: form.data,
          pessoa_id: form.pessoa_id || null,
          descricao: form.descricao || null
        })
        .select()
        .single();

      if (error) throw error;

      // atualiza estado local com a ocorrência inserida
      setOcorrencias((prev) => [data, ...prev]);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao adicionar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  // ----- NOVA FUNÇÃO: delete ocorrência -----
  const handleDeleteOcorrencia = async (id: string) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('grupo_ocorrencias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOcorrencias((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao remover ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvento = async (form: any) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      // Se for recorrente e não tiver data, usar uma data padrão (próxima ocorrência)
      let dataHoraInicio;
      if (form.eh_recorrente && !form.data_inicio) {
        // Usar próxima ocorrência do dia da semana selecionado
        const hoje = new Date();
        const diaSemanaEvento = form.recorrencia_dia_semana;
        const diaSemanaHoje = hoje.getDay();
        let diasAte = diaSemanaEvento - diaSemanaHoje;
        if (diasAte <= 0) diasAte += 7;

        const proximaData = new Date(hoje);
        proximaData.setDate(hoje.getDate() + diasAte);
        const dataStr = proximaData.toISOString().split('T')[0];
        dataHoraInicio = `${dataStr}T${form.hora_inicio}:00`;
      } else {
        dataHoraInicio = `${form.data_inicio}T${form.hora_inicio}:00`;
      }

      const { data, error } = await supabase
        .from('grupo_eventos')
        .insert({
          grupo_id: grupo.id,
          titulo: form.titulo,
          tipo: form.tipo,
          descricao: form.descricao || null,
          data_inicio: dataHoraInicio,
          local: form.local || null,
          endereco: form.endereco || null,
          eh_recorrente: form.eh_recorrente,
          recorrencia_tipo: form.eh_recorrente ? form.recorrencia_tipo : null,
          recorrencia_dia_semana: form.eh_recorrente ? form.recorrencia_dia_semana : null,
          recorrencia_fim: form.eh_recorrente && form.recorrencia_fim ? form.recorrencia_fim : null,
          max_participantes: form.max_participantes ? parseInt(form.max_participantes) : null,
          requer_confirmacao: form.requer_confirmacao,
          responsavel_id: form.responsavel_id || null,
          cor: form.cor
        })
        .select()
        .single();

      if (error) throw error;

      setEventos((prev) =>
        [...prev, data].sort((a: any, b: any) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
      );
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao adicionar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvento = async (id: string, form: any) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      // Se for recorrente e não tiver data, usar uma data padrão
      let dataHoraInicio;
      if (form.eh_recorrente && !form.data_inicio) {
        const hoje = new Date();
        const diaSemanaEvento = form.recorrencia_dia_semana;
        const diaSemanaHoje = hoje.getDay();
        let diasAte = diaSemanaEvento - diaSemanaHoje;
        if (diasAte <= 0) diasAte += 7;

        const proximaData = new Date(hoje);
        proximaData.setDate(hoje.getDate() + diasAte);
        const dataStr = proximaData.toISOString().split('T')[0];
        dataHoraInicio = `${dataStr}T${form.hora_inicio}:00`;
      } else {
        dataHoraInicio = `${form.data_inicio}T${form.hora_inicio}:00`;
      }

      const { data, error } = await supabase
        .from('grupo_eventos')
        .update({
          titulo: form.titulo,
          tipo: form.tipo,
          descricao: form.descricao || null,
          data_inicio: dataHoraInicio,
          local: form.local || null,
          endereco: form.endereco || null,
          eh_recorrente: form.eh_recorrente,
          recorrencia_tipo: form.eh_recorrente ? form.recorrencia_tipo : null,
          recorrencia_dia_semana: form.eh_recorrente ? form.recorrencia_dia_semana : null,
          recorrencia_fim: form.eh_recorrente && form.recorrencia_fim ? form.recorrencia_fim : null,
          max_participantes: form.max_participantes ? parseInt(form.max_participantes) : null,
          requer_confirmacao: form.requer_confirmacao,
          responsavel_id: form.responsavel_id || null,
          cor: form.cor
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEventos((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao atualizar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvento = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('grupo_eventos').delete().eq('id', id);

      if (error) throw error;

      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao remover evento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const pessoaNomeById = (id?: string | null) => {
    if (!id) return '—';
    return pessoas.find((p) => p.id === id)?.nome_completo || '—';
  };

  if (!grupo) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dados', label: 'Dados' },
    { id: 'membros', label: 'Membros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'ocorrencias', label: 'Ocorrências' },
    { id: 'historico', label: 'Histórico' }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{grupoAtualizado?.nome || grupo?.nome}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {grupoAtualizado?.membros_count || grupo?.membros_count || 0} membro(s)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dados' && grupoAtualizado && (
            <DadosTab grupo={grupoAtualizado} membros={membros} onChangeLeadership={handleChangeLeadership} pessoaNomeById={pessoaNomeById} />
          )}

          {activeTab === 'membros' && (
            <MembrosTab
              membros={membros}
              todasPessoas={pessoas}
              grupoId={grupo.id!}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onViewPessoa={onViewPessoa}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'eventos' && (
            <EventosTab eventos={eventos} membros={membros} grupoId={grupo.id!} onAdd={handleAddEvento} onUpdate={handleUpdateEvento} onDelete={handleDeleteEvento} />
          )}

          {activeTab === 'ocorrencias' && (
            <OcorrenciasTab ocorrencias={ocorrencias} membros={membros} pessoas={pessoas} onAdd={handleAddOcorrencia} onDelete={handleDeleteOcorrencia} />
          )}

          {activeTab === 'historico' && <HistoricoTab historico={historico} formatDate={formatDate} />}
        </div>
      </div>
    </div>
  );
}

// components/GruposFamiliares/GrupoViewModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import { supabase, Pessoa } from '../../lib/supabase';
import { GrupoWithCounts, TabType, LeadershipField, MembroHistorico, Ocorrencia, OcorrenciaForm } from '../../types/grupos';
import DadosTab from './Tabs/DadosTab';
import MembrosTab from './Tabs/MembrosTab';
import OcorrenciasTab from './Tabs/OcorrenciasTab';
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
  const [loading, setLoading] = useState(false);

  // Carregar dados quando o modal abre
  useEffect(() => {
    if (grupo?.id) {
      loadGrupoData();
    }
  }, [grupo?.id]);

  const loadGrupoData = async () => {
    if (!grupo?.id) return;
    
    const { data: membrosData } = await supabase
      .from('pessoas')
      .select('*')
      .eq('grupo_familiar_id', grupo.id)
      .order('nome_completo');
    
    const { data: ocorrsData } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('grupo_id', grupo.id)
      .order('data_ocorrencia', { ascending: false });
    
    const { data: histData } = await supabase
      .from('grupo_membros_historico')
      .select('*')
      .eq('grupo_id', grupo.id)
      .order('data', { ascending: false });

    setMembros(membrosData || []);
    setOcorrencias(ocorrsData || []);
    setHistorico(histData || []);
  };

  const handleAddMember = async (pessoa: Pessoa, papel: string) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      await supabase.from('pessoas').update({
        grupo_familiar_id: grupo.id,
        papel_grupo: papel
      }).eq('id', pessoa.id);

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
      await supabase.from('pessoas').update({
        grupo_familiar_id: null,
        papel_grupo: null
      }).eq('id', pessoa.id);

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

  const handleChangeLeadership = async (field: LeadershipField, pessoaId: string) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      const prevValue = (grupo as any)[field];
      
      await supabase.from('grupos_familiares').update({
        [field]: pessoaId || null
      }).eq('id', grupo.id);

      if (pessoaId) {
        const papel = field.startsWith('co_') ? 'co-líder' : 'líder';
        await supabase.from('pessoas').update({
          grupo_familiar_id: grupo.id,
          papel_grupo: papel
        }).eq('id', pessoaId);
      }

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

      const now = new Date().toISOString();
      await supabase.from('grupo_membros_historico').insert({
        grupo_id: grupo.id,
        pessoa_id: pessoaId || null,
        acao: field.startsWith('co_') ? 'co_lider_alterado' : 'lider_alterado',
        papel: field.startsWith('co_') ? 'co-líder' : 'líder',
        data: now,
        nota: `Campo ${field} atualizado`
      });

      await loadGrupoData();
      onReload();
    } catch (e) {
      console.error(e);
      alert('Erro ao alterar liderança');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOcorrencia = async (form: OcorrenciaForm) => {
    if (!grupo?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ocorrencias').insert({
        tipo_ocorrencia_id: form.tipo,
        pessoa_id: form.pessoa_id || null,
        data_ocorrencia: form.data,
        descricao: form.descricao || null,
        grupo_id: grupo.id
      }).select().single();

      if (error) throw error;
      
      setOcorrencias(prev => [data, ...prev]);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao adicionar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOcorrencia = async (id: string) => {
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
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const pessoaNomeById = (id?: string | null) => {
    if (!id) return '—';
    return pessoas.find(p => p.id === id)?.nome_completo || '—';
  };

  if (!grupo) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dados', label: 'Dados' },
    { id: 'membros', label: 'Membros' },
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
              <h3 className="text-2xl font-bold text-slate-900">{grupo.nome}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {grupo.membros_count || 0} membro(s)
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
          {activeTab === 'dados' && (
            <DadosTab
              grupo={grupo}
              membros={membros}
              onChangeLeadership={handleChangeLeadership}
              pessoaNomeById={pessoaNomeById}
            />
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

          {activeTab === 'ocorrencias' && (
            <OcorrenciasTab
              ocorrencias={ocorrencias}
              membros={membros}
              pessoas={pessoas}
              onAdd={handleAddOcorrencia}
              onDelete={handleDeleteOcorrencia}
            />
          )}

          {activeTab === 'historico' && (
            <HistoricoTab
              historico={historico}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
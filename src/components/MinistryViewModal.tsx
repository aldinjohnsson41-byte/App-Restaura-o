// components/MinistryViewModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Edit, Users, Calendar, History } from 'lucide-react';
import { supabase, Pessoa } from '../lib/supabase';
import { Ministry } from '../types/ministryPage.types';
import { StatusBadge } from './StatusBadge';

// Tabs
import MinistryDadosTab from './MinistryTabs/MinistryDadosTab';
import MinistryMembrosTab from './MinistryTabs/MinistryMembrosTab';
import MinistryEscalasTab from './MinistryTabs/MinistryEscalasTab';

type TabType = 'dados' | 'membros' | 'escalas';

interface MinistryMember {
  id: string;
  ministry_id: string;
  pessoa_id: string;
  funcao: 'membro' | 'lider';
  status: 'ativo' | 'inativo' | 'afastado';
  data_entrada: string;
  data_saida?: string;
  observacoes?: string;
  pessoa?: Pessoa;
}

interface MinistrySchedule {
  id: string;
  ministry_id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  observacoes?: string;
  membros?: any[];
}

interface MinistryViewModalProps {
  ministry: Ministry | null;
  pessoas: Pessoa[];
  onClose: () => void;
  onEdit: () => void;
  onReload: () => void;
}

export default function MinistryViewModal({
  ministry,
  pessoas,
  onClose,
  onEdit,
  onReload
}: MinistryViewModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [membros, setMembros] = useState<MinistryMember[]>([]);
  const [escalas, setEscalas] = useState<MinistrySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [ministryAtualizado, setMinistryAtualizado] = useState<Ministry | null>(ministry);

  useEffect(() => {
    if (ministry?.id) {
      setMinistryAtualizado(ministry);
      loadMinistryData();
    }
  }, [ministry?.id]);

  const loadMinistryData = async () => {
    if (!ministry?.id) return;
    setLoading(true);
    try {
      // Recarregar dados do ministério
      const { data: ministryData } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', ministry.id)
        .single();

      if (ministryData) {
        setMinistryAtualizado({ 
          ...ministryData, 
          membros_count: ministry.membros_count,
          escalas_count: ministry.escalas_count 
        });
      }

      // Carregar membros do ministério com dados da pessoa
      const { data: membrosData } = await supabase
        .from('ministry_members')
        .select(`
          *,
          pessoa:pessoa_id(*)
        `)
        .eq('ministry_id', ministry.id)
        .order('funcao', { ascending: false })
        .order('data_entrada', { ascending: false });

      // Carregar escalas do ministério
      const { data: escalasData } = await supabase
        .from('ministry_schedules')
        .select(`
          *,
          membros:ministry_schedule_members(
            *,
            pessoa:pessoa_id(*)
          )
        `)
        .eq('ministry_id', ministry.id)
        .gte('data_escala', new Date().toISOString().split('T')[0])
        .order('data_escala', { ascending: true });

      setMembros(membrosData || []);
      setEscalas(escalasData || []);
    } catch (e) {
      console.error('Erro ao carregar dados do ministério:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (pessoa: Pessoa, funcao: 'membro' | 'lider') => {
    if (!ministry?.id) return;
    setLoading(true);
    try {
      // Verificar se a pessoa já é membro
      const { data: existing } = await supabase
        .from('ministry_members')
        .select('id')
        .eq('ministry_id', ministry.id)
        .eq('pessoa_id', pessoa.id)
        .single();

      if (existing) {
        alert('Esta pessoa já é membro deste ministério');
        return;
      }

      // Adicionar membro
      const { data, error } = await supabase
        .from('ministry_members')
        .insert({
          ministry_id: ministry.id,
          pessoa_id: pessoa.id,
          funcao,
          status: 'ativo',
          data_entrada: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: data.id,
        acao: 'create',
        dados_novos: data,
        motivo: `Membro ${pessoa.nome_completo} adicionado ao ministério`
      });

      await loadMinistryData();
      onReload();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (membro: MinistryMember) => {
    if (!ministry?.id) return;
    
    if (!confirm(`Remover ${membro.pessoa?.nome_completo || 'este membro'} do ministério?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ministry_members')
        .delete()
        .eq('id', membro.id);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: membro.id,
        acao: 'delete',
        dados_anteriores: membro,
        motivo: `Membro ${membro.pessoa?.nome_completo} removido do ministério`
      });

      await loadMinistryData();
      onReload();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (
    membro: MinistryMember, 
    novaFuncao: 'membro' | 'lider'
  ) => {
    if (!ministry?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministry_members')
        .update({ funcao: novaFuncao })
        .eq('id', membro.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: membro.id,
        acao: 'update',
        dados_anteriores: membro,
        dados_novos: data,
        motivo: `Função alterada: ${membro.funcao} → ${novaFuncao}`
      });

      await loadMinistryData();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao atualizar função');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberStatus = async (
    membro: MinistryMember,
    novoStatus: 'ativo' | 'inativo' | 'afastado'
  ) => {
    if (!ministry?.id) return;
    setLoading(true);
    try {
      const updates: any = { status: novoStatus };
      
      if (novoStatus === 'inativo' || novoStatus === 'afastado') {
        updates.data_saida = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('ministry_members')
        .update(updates)
        .eq('id', membro.id)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministry_members',
        registro_id: membro.id,
        acao: 'update',
        dados_anteriores: membro,
        dados_novos: data,
        motivo: `Status alterado: ${membro.status} → ${novoStatus}`
      });

      await loadMinistryData();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  if (!ministry) return null;

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'dados', label: 'Dados', icon: Users },
    { id: 'membros', label: 'Membros', icon: Users },
    { id: 'escalas', label: 'Escalas', icon: Calendar }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: ministry.cor + '20' }}
              >
                <Users className="w-8 h-8" style={{ color: ministry.cor }} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {ministryAtualizado?.nome || ministry.nome}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={ministryAtualizado?.status || ministry.status} />
                  <p className="text-sm text-slate-500">
                    {membros.filter(m => m.status === 'ativo').length} membro(s) ativo(s)
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
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
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dados' && ministryAtualizado && (
            <MinistryDadosTab ministry={ministryAtualizado} membros={membros} />
          )}

          {activeTab === 'membros' && (
            <MinistryMembrosTab
              membros={membros}
              todasPessoas={pessoas}
              ministryId={ministry.id!}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onUpdateRole={handleUpdateMemberRole}
              onUpdateStatus={handleUpdateMemberStatus}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'escalas' && (
            <MinistryEscalasTab 
              escalas={escalas}
              ministryId={ministry.id!}
              onReload={loadMinistryData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
// pages/MinistryPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase, Pessoa } from '../lib/supabase';
import { Ministry, MinistryFormData, ViewType } from '../types/ministryPage.types';
import MinistryListView from '../components/MinistryListView';
import MinistryFormView from '../components/MinistryFormView';
import MinistryViewModal from '../components/MinistryViewModal';

export default function MinistryPage() {
  const [view, setView] = useState<ViewType>('list');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [viewingMinistry, setViewingMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState<MinistryFormData>({
    nome: '',
    descricao: '',
    status: 'ativo',
    cor: '#3B82F6'
  });

  useEffect(() => {
    loadMinistries();
    loadPessoas();
  }, []);

  const loadPessoas = async () => {
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .order('nome_completo');

      if (error) throw error;
      setPessoas(data || []);
    } catch (e) {
      console.error('Erro ao carregar pessoas:', e);
    }
  };

  const loadMinistries = async () => {
    setLoading(true);
    try {
      const { data: ministriesData, error } = await supabase
        .from('ministries')
        .select('*')
        .order('nome');

      if (error) throw error;

      // Carregar contagem de membros para cada ministério
      const ministriesWithCounts = await Promise.all(
        (ministriesData || []).map(async (ministry) => {
          const { count: membrosCount } = await supabase
            .from('ministry_members')
            .select('*', { count: 'exact', head: true })
            .eq('ministry_id', ministry.id)
            .eq('status', 'ativo');

          const { count: escalasCount } = await supabase
            .from('ministry_schedules')
            .select('*', { count: 'exact', head: true })
            .eq('ministry_id', ministry.id)
            .gte('data_escala', new Date().toISOString().split('T')[0])
            .neq('status', 'cancelada');

          return {
            ...ministry,
            membros_count: membrosCount || 0,
            escalas_count: escalasCount || 0
          };
        })
      );

      setMinistries(ministriesWithCounts);
    } catch (e) {
      console.error('Erro ao carregar ministérios:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMinistry = () => {
    setSelectedMinistry(null);
    setFormData({
      nome: '',
      descricao: '',
      status: 'ativo',
      cor: '#3B82F6'
    });
    setView('form');
  };

  const handleEditMinistry = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setFormData({
      nome: ministry.nome,
      descricao: ministry.descricao || '',
      status: ministry.status,
      cor: ministry.cor
    });
    setView('form');
  };

  const handleViewMinistry = (ministry: Ministry) => {
    setViewingMinistry(ministry);
  };

  const handleSaveMinistry = async () => {
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (selectedMinistry) {
        // Atualizar
        const { data: oldData } = await supabase
          .from('ministries')
          .select('*')
          .eq('id', selectedMinistry.id)
          .single();

        const { error } = await supabase
          .from('ministries')
          .update(formData)
          .eq('id', selectedMinistry.id);

        if (error) throw error;

        // Registrar no histórico
        await supabase.from('schedule_changes_history').insert({
          tabela: 'ministries',
          registro_id: selectedMinistry.id,
          acao: 'update',
          dados_anteriores: oldData,
          dados_novos: { ...oldData, ...formData },
          motivo: 'Atualização via formulário'
        });
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('ministries')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        // Registrar no histórico
        await supabase.from('schedule_changes_history').insert({
          tabela: 'ministries',
          registro_id: data.id,
          acao: 'create',
          dados_novos: data,
          motivo: 'Criação via formulário'
        });
      }

      await loadMinistries();
      setView('list');
    } catch (e: any) {
      console.error('Erro ao salvar ministério:', e);
      alert(e?.message || 'Erro ao salvar ministério');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    if (!confirm('Deseja realmente excluir este ministério? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      // Verificar se há membros
      const { count } = await supabase
        .from('ministry_members')
        .select('*', { count: 'exact', head: true })
        .eq('ministry_id', id);

      if (count && count > 0) {
        if (
          !confirm(
            `Este ministério tem ${count} membro(s). Deseja realmente excluir?`
          )
        ) {
          setLoading(false);
          return;
        }
      }

      // Buscar dados antes de deletar
      const { data: oldData } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('ministries').delete().eq('id', id);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from('schedule_changes_history').insert({
        tabela: 'ministries',
        registro_id: id,
        acao: 'delete',
        dados_anteriores: oldData,
        motivo: 'Exclusão via interface'
      });

      await loadMinistries();
    } catch (e: any) {
      console.error('Erro ao excluir ministério:', e);
      alert(e?.message || 'Erro ao excluir ministério');
    } finally {
      setLoading(false);
    }
  };

  const filteredMinistries = ministries.filter((ministry) => {
    const matchesSearch = ministry.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || ministry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {view === 'list' && (
        <MinistryListView
          ministries={filteredMinistries}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onNewMinistry={handleNewMinistry}
          onEditMinistry={handleEditMinistry}
          onDeleteMinistry={handleDeleteMinistry}
          onViewMinistry={handleViewMinistry}
        />
      )}

      {view === 'form' && (
        <MinistryFormView
          formData={formData}
          selectedMinistry={selectedMinistry}
          onFormChange={setFormData}
          onSave={handleSaveMinistry}
          onCancel={() => setView('list')}
        />
      )}

      {viewingMinistry && (
        <MinistryViewModal
          ministry={viewingMinistry}
          pessoas={pessoas}
          onClose={() => setViewingMinistry(null)}
          onEdit={() => {
            handleEditMinistry(viewingMinistry);
            setViewingMinistry(null);
          }}
          onReload={loadMinistries}
        />
      )}
    </>
  );
}
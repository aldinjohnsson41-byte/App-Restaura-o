// MinisteriosPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Users, Plus, Edit, Trash2, Calendar, UserPlus,
  Search, ArrowLeft, Save, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  Ministry, Pessoa, MinistryMemberRow, ScheduleRow, ScaleMemberRow,
  MinistryFormData, MemberFormData, ScheduleFormData,
  MinistryStatus, MemberRole, MemberStatus
} from './types';
import { formatDatePtBr, StatusBadge } from './utils';
import { MemberModal, ScheduleModal } from './Modals';

export default function MinisteriosPage(): JSX.Element {
  // Views
  const [activeView, setActiveView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'membros' | 'escalas'>('dados');

  // Data
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [membersRows, setMembersRows] = useState<MinistryMemberRow[]>([]);
  const [schedulesRows, setSchedulesRows] = useState<ScheduleRow[]>([]);
  const [scaleMembersRows, setScaleMembersRows] = useState<Record<string, ScaleMemberRow[]>>({});
  const [allPeople, setAllPeople] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms
  const [formData, setFormData] = useState<MinistryFormData>({
    nome: '',
    descricao: '',
    status: 'ativo',
    cor: '#3B82F6'
  });

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberRow, setEditingMemberRow] = useState<MinistryMemberRow | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>({
    pessoa_id: '',
    funcao: 'membro',
    status: 'ativo',
    data_entrada: new Date().toISOString().split('T')[0]
  });

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRow | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    data_escala: '',
    hora_inicio: '09:00',
    hora_fim: '11:00',
    observacoes: ''
  });
  const [selectedMembersForSchedule, setSelectedMembersForSchedule] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MinistryStatus | 'all'>('all');

  // ============= EFFECTS =============
  useEffect(() => {
    loadMinistries();
    loadAllPeople();
  }, []);

  // ============= LOAD DATA =============
  const loadMinistries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setMinistries(data || []);
    } catch (e) {
      console.error('Erro ao carregar ministérios', e);
      alert('Erro ao carregar ministérios');
    } finally {
      setLoading(false);
    }
  };

  const loadAllPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .order('nome_completo', { ascending: true })
        .limit(1000);

      if (error) throw error;
      setAllPeople(data || []);
    } catch (e) {
      console.error('Erro ao carregar pessoas', e);
    }
  };

  const loadMinistryDetails = async (ministryId: string) => {
    setLoading(true);
    try {
      // Load ministry
      const { data: ministryData, error: ministryError } = await supabase
        .from('ministerios')
        .select('*')
        .eq('id', ministryId)
        .single();
      if (ministryError) throw ministryError;
      setSelectedMinistry(ministryData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('membros_ministerio')
        .select(`
          *,
          pessoa:pessoas(*)
        `)
        .eq('ministerio_id', ministryId)
        .order('data_entrada', { ascending: true });

      if (membersError) throw membersError;
      setMembersRows(membersData || []);

      // Load schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('escalas_ministerio')
        .select('*')
        .eq('ministerio_id', ministryId)
        .order('data_escala', { ascending: true });

      if (schedulesError) throw schedulesError;
      setSchedulesRows(schedulesData || []);

      // Load schedule members
      if (schedulesData && schedulesData.length > 0) {
        const scaleIds = schedulesData.map(s => s.id);
        const { data: scaleMembersData, error: scaleMembersError } = await supabase
          .from('detalhes_escala_ministerio')
          .select(`
            *,
            pessoa:pessoas(*)
          `)
          .in('escala_id', scaleIds);

        if (scaleMembersError) throw scaleMembersError;

        const grouped: Record<string, ScaleMemberRow[]> = {};
        (scaleMembersData || []).forEach((r: any) => {
          if (!grouped[r.escala_id]) grouped[r.escala_id] = [];
          grouped[r.escala_id].push(r);
        });
        setScaleMembersRows(grouped);
      } else {
        setScaleMembersRows({});
      }

      setActiveView('details');
    } catch (e) {
      console.error('Erro ao carregar detalhes do ministério', e);
      alert('Erro ao carregar detalhes do ministério');
    } finally {
      setLoading(false);
    }
  };

  // ============= MINISTRY CRUD =============
  const handleNewMinistry = () => {
    setFormData({ nome: '', descricao: '', status: 'ativo', cor: '#3B82F6' });
    setSelectedMinistry(null);
    setActiveView('form');
  };

  const handleEditMinistry = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setFormData({
      nome: ministry.nome,
      descricao: ministry.descricao || '',
      status: ministry.status,
      cor: ministry.cor
    });
    setActiveView('form');
  };

  const handleSaveMinistry = async () => {
    if (!formData.nome.trim()) {
      alert('Nome do ministério é obrigatório');
      return;
    }
    setLoading(true);
    try {
      if (selectedMinistry) {
        const { data, error } = await supabase
          .from('ministerios')
          .update(formData)
          .eq('id', selectedMinistry.id)
          .select()
          .single();
        if (error) throw error;
        setMinistries(prev => prev.map(m => (m.id === data.id ? data : m)));
      } else {
        const { data, error } = await supabase
          .from('ministerios')
          .insert(formData)
          .select()
          .single();
        if (error) throw error;
        setMinistries(prev => [data, ...prev]);
      }
      setActiveView('list');
    } catch (e) {
      console.error('Erro ao salvar ministério', e);
      alert('Erro ao salvar ministério');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    if (!confirm('Deseja realmente excluir este ministério?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('ministerios').delete().eq('id', id);
      if (error) throw error;
      setMinistries(prev => prev.filter(m => m.id !== id));
      if (selectedMinistry?.id === id) {
        setSelectedMinistry(null);
        setActiveView('list');
      }
    } catch (e) {
      console.error('Erro ao excluir ministério', e);
      alert('Erro ao excluir ministério');
    } finally {
      setLoading(false);
    }
  };

  // ============= MEMBER CRUD =============
  const openAddMemberModal = () => {
    setEditingMemberRow(null);
    setMemberForm({
      pessoa_id: '',
      funcao: 'membro',
      status: 'ativo',
      data_entrada: new Date().toISOString().split('T')[0]
    });
    setShowMemberModal(true);
  };

  const openEditMemberModal = (row: MinistryMemberRow) => {
    setEditingMemberRow(row);
    setMemberForm({
      pessoa_id: row.pessoa_id,
      funcao: (row.funcao as MemberRole) || 'membro',
      status: (row.status as MemberStatus) || 'ativo',
      data_entrada: row.data_entrada || new Date().toISOString().split('T')[0]
    });
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!selectedMinistry || !memberForm.pessoa_id) {
      alert('Selecione uma pessoa');
      return;
    }
    setLoading(true);
    try {
      if (editingMemberRow) {
        const { error } = await supabase
          .from('membros_ministerio')
          .update({
            pessoa_id: memberForm.pessoa_id,
            funcao: memberForm.funcao,
            status: memberForm.status,
            data_entrada: memberForm.data_entrada
          })
          .eq('id', editingMemberRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('membros_ministerio')
          .insert({
            ministerio_id: selectedMinistry.id,
            ...memberForm
          });
        if (error) throw error;
      }
      await loadMinistryDetails(selectedMinistry.id);
      await loadMinistries();
      setShowMemberModal(false);
      setEditingMemberRow(null);
    } catch (e) {
      console.error('Erro ao salvar membro', e);
      alert('Erro ao salvar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberRowId: string) => {
    if (!confirm('Deseja realmente remover este membro?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('membros_ministerio')
        .delete()
        .eq('id', memberRowId);
      if (error) throw error;
      if (selectedMinistry) await loadMinistryDetails(selectedMinistry.id);
    } catch (e) {
      console.error('Erro ao remover membro', e);
      alert('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  // ============= SCHEDULE CRUD =============
  const openNewScheduleModal = () => {
    setEditingSchedule(null);
    setScheduleForm({
      data_escala: '',
      hora_inicio: '09:00',
      hora_fim: '11:00',
      observacoes: ''
    });
    setSelectedMembersForSchedule([]);
    setShowScheduleModal(true);
  };

  const openEditScheduleModal = async (schedule: ScheduleRow) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      data_escala: schedule.data_escala,
      hora_inicio: schedule.hora_inicio,
      hora_fim: schedule.hora_fim,
      observacoes: schedule.observacoes || ''
    });

    const { data } = await supabase
      .from('detalhes_escala_ministerio')
      .select('pessoa_id')
      .eq('escala_id', schedule.id);

    setSelectedMembersForSchedule((data || []).map(r => r.pessoa_id));
    setShowScheduleModal(true);
  };

  const toggleMemberSelectionForSchedule = (pessoaId: string) => {
    if (pessoaId === '') {
      setSelectedMembersForSchedule([]);
    } else {
      setSelectedMembersForSchedule(prev =>
        prev.includes(pessoaId) 
          ? prev.filter(id => id !== pessoaId) 
          : [...prev, pessoaId]
      );
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedMinistry || !scheduleForm.data_escala) {
      alert('Informe a data da escala');
      return;
    }
    if (selectedMembersForSchedule.length === 0) {
      alert('Selecione pelo menos um membro');
      return;
    }
    setLoading(true);
    try {
      if (editingSchedule) {
        await supabase
          .from('escalas_ministerio')
          .update({
            data_escala: scheduleForm.data_escala,
            hora_inicio: scheduleForm.hora_inicio,
            hora_fim: scheduleForm.hora_fim,
            observacoes: scheduleForm.observacoes
          })
          .eq('id', editingSchedule.id);

        await supabase
          .from('detalhes_escala_ministerio')
          .delete()
          .eq('escala_id', editingSchedule.id);

        const inserts = selectedMembersForSchedule.map(pessoa_id => ({
          escala_id: editingSchedule.id,
          pessoa_id
        }));
        await supabase.from('detalhes_escala_ministerio').insert(inserts);
      } else {
        const { data: newSchedule } = await supabase
          .from('escalas_ministerio')
          .insert({
            ministerio_id: selectedMinistry.id,
            ...scheduleForm,
            status: 'planejada'
          })
          .select()
          .single();

        if (newSchedule) {
          const inserts = selectedMembersForSchedule.map(pessoa_id => ({
            escala_id: newSchedule.id,
            pessoa_id
          }));
          await supabase.from('detalhes_escala_ministerio').insert(inserts);
        }
      }

      await loadMinistryDetails(selectedMinistry.id);
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setSelectedMembersForSchedule([]);
    } catch (e) {
      console.error('Erro ao salvar escala', e);
      alert('Erro ao salvar escala');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Deseja realmente excluir esta escala?')) return;
    setLoading(true);
    try {
      await supabase
        .from('detalhes_escala_ministerio')
        .delete()
        .eq('escala_id', scheduleId);
      await supabase.from('escalas_ministerio').delete().eq('id', scheduleId);
      if (selectedMinistry) await loadMinistryDetails(selectedMinistry.id);
    } catch (e) {
      console.error('Erro ao excluir escala', e);
      alert('Erro ao excluir escala');
    } finally {
      setLoading(false);
    }
  };

  // ============= FILTERS =============
  const filteredMinistries = ministries.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ============= RENDERS =============
  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}

      {activeView === 'list' && (
        <ListView
          filteredMinistries={filteredMinistries}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          handleNewMinistry={handleNewMinistry}
          handleEditMinistry={handleEditMinistry}
          handleDeleteMinistry={handleDeleteMinistry}
          loadMinistryDetails={loadMinistryDetails}
        />
      )}

      {activeView === 'form' && (
        <FormView
          selectedMinistry={selectedMinistry}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSaveMinistry}
          handleCancel={() => setActiveView('list')}
        />
      )}

      {activeView === 'details' && selectedMinistry && (
        <DetailsView
          ministry={selectedMinistry}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          membersRows={membersRows}
          schedulesRows={schedulesRows}
          scaleMembersRows={scaleMembersRows}
          handleBack={() => setActiveView('list')}
          handleEdit={() => handleEditMinistry(selectedMinistry)}
          openAddMemberModal={openAddMemberModal}
          openEditMemberModal={openEditMemberModal}
          handleDeleteMember={handleDeleteMember}
          openNewScheduleModal={openNewScheduleModal}
          openEditScheduleModal={openEditScheduleModal}
          handleDeleteSchedule={handleDeleteSchedule}
        />
      )}

      <MemberModal
        show={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setEditingMemberRow(null);
        }}
        onSave={handleSaveMember}
        editing={editingMemberRow}
        formData={memberForm}
        setFormData={setMemberForm}
        allPeople={allPeople}
        existingMemberIds={membersRows.map(m => m.pessoa_id)}
      />

      <ScheduleModal
        show={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
          setSelectedMembersForSchedule([]);
        }}
        onSave={handleSaveSchedule}
        editing={editingSchedule}
        formData={scheduleForm}
        setFormData={setScheduleForm}
        activeMembers={membersRows.filter(m => m.status === 'ativo')}
        selectedMembers={selectedMembersForSchedule}
        toggleMember={toggleMemberSelectionForSchedule}
      />
    </>
  );
}
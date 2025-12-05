// pages/MinisteriosPage.tsx
import React, { useState } from 'react';
import { 
  Ministry, 
  Member, 
  Schedule, 
  MinistryFormData, 
  MinistryStatus,
  ViewType,
  TabType 
} from '../types/ministryPage.types';
import { MinistryListView } from '../components/MinistryListView';
import { MinistryFormView } from '../components/MinistryFormView';
import { MinistryDetailsView } from '../components/MinistryDetailsView';
import { mockMinistries, mockMembers, mockSchedules } from '../data/ministryMockData';

export default function MinistriesPage() {
  const [activeView, setActiveView] = useState<ViewType>('list');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  
  const [ministries, setMinistries] = useState<Ministry[]>(mockMinistries);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  const [formData, setFormData] = useState<MinistryFormData>({
    nome: '',
    descricao: '',
    status: 'ativo',
    cor: '#3B82F6'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MinistryStatus | 'all'>('all');

  // Handlers
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

  const handleViewMinistry = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setActiveTab('dados');
    setActiveView('details');
  };

  const handleSaveMinistry = () => {
    if (!formData.nome.trim()) {
      alert('Nome do ministério é obrigatório');
      return;
    }

    if (selectedMinistry) {
      setMinistries(ministries.map(m => 
        m.id === selectedMinistry.id 
          ? { ...m, ...formData }
          : m
      ));
    } else {
      const newMinistry: Ministry = {
        id: Date.now().toString(),
        ...formData,
        membros_count: 0,
        escalas_count: 0
      };
      setMinistries([...ministries, newMinistry]);
    }
    setActiveView('list');
  };

  const handleDeleteMinistry = (id: string) => {
    if (confirm('Deseja realmente excluir este ministério?')) {
      setMinistries(ministries.filter(m => m.id !== id));
    }
  };

  // Filtrar ministérios
  const filteredMinistries = ministries.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Renderização condicional
  if (activeView === 'list') {
    return (
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
    );
  }

  if (activeView === 'form') {
    return (
      <MinistryFormView
        formData={formData}
        selectedMinistry={selectedMinistry}
        onFormChange={setFormData}
        onSave={handleSaveMinistry}
        onCancel={() => setActiveView('list')}
      />
    );
  }

  if (activeView === 'details' && selectedMinistry) {
    return (
      <MinistryDetailsView
        ministry={selectedMinistry}
        members={members}
        schedules={schedules}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => setActiveView('list')}
        onEdit={() => handleEditMinistry(selectedMinistry)}
      />
    );
  }

  return null;
}
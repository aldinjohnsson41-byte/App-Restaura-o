// pages/MinisteriesPage.tsx
import React, { useState, useEffect } from 'react';

import { 
  Ministry, 
  Schedule, 
  MinistryFormData, 
  MinistryStatus,
  ViewType,
  TabType 
} from '../types/ministryPage.types';

import { MinistryListView } from '../components/MinistryListView';
import { MinistryFormView } from '../components/MinistryFormView';
import { MinistryDetailsView } from '../components/MinistryDetailsView';

import { mockMinistries, mockSchedules } from '../data/ministryMockData';

// 🚨 Importação correta do Supabase + Tipo Pessoa
import { supabase, Pessoa } from '../lib/supabase';

export default function MinistriesPage() {
  const [activeView, setActiveView] = useState<ViewType>('list');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dados');

  // Ministérios continuam mock até você pedir para conectar
  const [ministries, setMinistries] = useState<Ministry[]>(mockMinistries);

  // ❗ Agora os membros são pessoas REAIS do Supabase
  const [members, setMembers] = useState<Pessoa[]>([]);

  // Escalas continuam mock até você pedir para integrar
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  const [formData, setFormData] = useState<MinistryFormData>({
    nome: '',
    descricao: '',
    status: 'ativo',
    cor: '#3B82F6'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MinistryStatus | 'all'>('all');

  // =======================================================
  // 📌 CARREGAR PESSOAS REAIS DO SUPABASE (IGUAL GRUPO VIEW)
  // =======================================================
  useEffect(() => {
    loadPessoas();
  }, []);

  const loadPessoas = async () => {
    const { data, error } = await supabase
      .from('pessoas')
      .select('*')
      .order('nome_completo', { ascending: true });

    if (error) {
      console.error("Erro ao carregar pessoas:", error);
      return;
    }

    setMembers(data || []);
  };

  // =======================================================
  // 📌 HANDLERS PRINCIPAIS
  // =======================================================

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
      setMinistries(
        ministries.map(m =>
          m.id === selectedMinistry.id ? { ...m, ...formData } : m
        )
      );
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

  // =======================================================
  // 📌 FILTROS
  // =======================================================

  const filteredMinistries = ministries.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // =======================================================
  // 📌 RENDERIZAÇÃO CONDICIONAL
  // =======================================================

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
        members={members}          // 👈 AGORA SÃO PESSOAS REAIS!
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

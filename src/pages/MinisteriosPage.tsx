import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Calendar, UserPlus, 
  Search, Filter, ChevronDown, Clock, CheckCircle,
  XCircle, AlertCircle, ArrowLeft, Save, X, Eye
} from 'lucide-react';

// Tipos (simplificados para o artifact)
type MinistryStatus = 'ativo' | 'inativo';
type MemberRole = 'membro' | 'lider';
type MemberStatus = 'ativo' | 'inativo' | 'afastado';

interface Ministry {
  id: string;
  nome: string;
  descricao?: string;
  status: MinistryStatus;
  cor: string;
  membros_count?: number;
  escalas_count?: number;
}

interface Member {
  id: string;
  pessoa_id: string;
  nome_completo: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
  email?: string;
  telefone?: string;
}

interface Schedule {
  id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  membros: Member[];
}

// Componente Principal
export default function MinistriesPage() {
  const [activeView, setActiveView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeTab, setActiveTab] = useState<'dados' | 'membros' | 'escalas'>('dados');
  
  // Mock data
  const [ministries, setMinistries] = useState<Ministry[]>([
    {
      id: '1',
      nome: 'Louvor e Adoração',
      descricao: 'Ministério de música e cânticos',
      status: 'ativo',
      cor: '#3B82F6',
      membros_count: 12,
      escalas_count: 8
    },
    {
      id: '2',
      nome: 'Infantil',
      descricao: 'Cuidado e ensino das crianças',
      status: 'ativo',
      cor: '#10B981',
      membros_count: 8,
      escalas_count: 4
    },
    {
      id: '3',
      nome: 'Intercessão',
      descricao: 'Oração e intercessão',
      status: 'ativo',
      cor: '#8B5CF6',
      membros_count: 15,
      escalas_count: 6
    }
  ]);

  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      pessoa_id: 'p1',
      nome_completo: 'João Silva',
      funcao: 'lider',
      status: 'ativo',
      data_entrada: '2023-01-15',
      email: 'joao@email.com',
      telefone: '(11) 98765-4321'
    },
    {
      id: '2',
      pessoa_id: 'p2',
      nome_completo: 'Maria Santos',
      funcao: 'membro',
      status: 'ativo',
      data_entrada: '2023-03-20',
      telefone: '(11) 98765-1234'
    }
  ]);

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: '1',
      data_escala: '2025-01-12',
      hora_inicio: '09:00',
      hora_fim: '11:00',
      status: 'confirmada',
      membros: []
    },
    {
      id: '2',
      data_escala: '2025-01-19',
      hora_inicio: '09:00',
      hora_fim: '11:00',
      status: 'planejada',
      membros: []
    }
  ]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'ativo' as MinistryStatus,
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

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800 border-green-200',
      inativo: 'bg-slate-100 text-slate-800 border-slate-200',
      afastado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      planejada: 'bg-blue-100 text-blue-800 border-blue-200',
      confirmada: 'bg-green-100 text-green-800 border-green-200',
      concluida: 'bg-slate-100 text-slate-800 border-slate-200',
      cancelada: 'bg-red-100 text-red-800 border-red-200',
      membro: 'bg-blue-100 text-blue-800 border-blue-200',
      lider: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.ativo}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Lista de Ministérios
  if (activeView === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Ministérios</h2>
              <p className="text-slate-600 mt-1">Gerencie ministérios, membros e escalas</p>
            </div>
            <button
              onClick={handleNewMinistry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Ministério
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar ministério..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMinistries.map((ministry) => (
              <div
                key={ministry.id}
                className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 cursor-pointer"
                onClick={() => handleViewMinistry(ministry)}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: ministry.cor + '20' }}
                    >
                      <Users className="w-6 h-6" style={{ color: ministry.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {ministry.nome}
                      </h3>
                      <StatusBadge status={ministry.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditMinistry(ministry)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteMinistry(ministry.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                {ministry.descricao && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {ministry.descricao}
                  </p>
                )}

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {ministry.membros_count || 0}
                    </div>
                    <div className="text-xs text-slate-600">Membros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {ministry.escalas_count || 0}
                    </div>
                    <div className="text-xs text-slate-600">Escalas</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredMinistries.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum ministério encontrado
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro ministério'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleNewMinistry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Ministério
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Formulário
  if (activeView === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('list')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedMinistry ? 'Editar Ministério' : 'Novo Ministério'}
              </h2>
              <p className="text-slate-600 text-sm">Preencha os dados do ministério</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Ministério *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Louvor e Adoração"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o propósito e atividades do ministério..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MinistryStatus })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cor
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="h-10 w-20 rounded border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveMinistry}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Ministério
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detalhes do Ministério (com Tabs)
  if (activeView === 'details' && selectedMinistry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveView('list')}
                className="p-2 hover:bg-white rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedMinistry.cor + '20' }}
                >
                  <Users className="w-6 h-6" style={{ color: selectedMinistry.cor }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedMinistry.nome}</h2>
                  <StatusBadge status={selectedMinistry.status} />
                </div>
              </div>
            </div>
            <button
              onClick={() => handleEditMinistry(selectedMinistry)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition bg-white"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-200">
              <nav className="flex gap-1 px-6">
                {[
                  { id: 'dados', label: 'Dados', icon: Users },
                  { id: 'membros', label: 'Membros', icon: UserPlus },
                  { id: 'escalas', label: 'Escalas', icon: Calendar }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
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

            <div className="p-6">
              {/* Tab: Dados */}
              {activeTab === 'dados' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Descrição</h3>
                    <p className="text-slate-900">
                      {selectedMinistry.descricao || 'Sem descrição cadastrada'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Cor</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: selectedMinistry.cor }}
                        />
                        <span className="text-slate-900 font-mono">{selectedMinistry.cor}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-500 mb-1">Status</h3>
                      <StatusBadge status={selectedMinistry.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-900 mb-1">
                        {selectedMinistry.membros_count || 0}
                      </div>
                      <div className="text-sm text-blue-700">Membros Ativos</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-900 mb-1">
                        {selectedMinistry.escalas_count || 0}
                      </div>
                      <div className="text-sm text-green-700">Escalas Futuras</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Membros */}
              {activeTab === 'membros' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Membros ({members.length})
                    </h3>
                    <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm">
                      <UserPlus className="w-4 h-4" />
                      Adicionar Membro
                    </button>
                  </div>

                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{member.nome_completo}</div>
                            <div className="text-sm text-slate-600">
                              {member.email || member.telefone}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={member.funcao} />
                          <StatusBadge status={member.status} />
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {members.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">Nenhum membro cadastrado</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Escalas */}
              {activeTab === 'escalas' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Próximas Escalas ({schedules.length})
                    </h3>
                    <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm">
                      <Plus className="w-4 h-4" />
                      Nova Escala
                    </button>
                  </div>

                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">
                                {new Date(schedule.data_escala).toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: 'long'
                                })}
                              </div>
                              <div className="text-sm text-slate-600">
                                {schedule.hora_inicio} - {schedule.hora_fim}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={schedule.status} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Users className="w-4 h-4" />
                          {schedule.membros.length} membro(s) escalado(s)
                        </div>
                      </div>
                    ))}
                  </div>

                  {schedules.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                      <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">Nenhuma escala cadastrada</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
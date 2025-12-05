// components/ministerios/Views.tsx
import React from 'react';
import {
  Users, Plus, Edit, Trash2, Calendar, UserPlus,
  Search, ArrowLeft, Save, X
} from 'lucide-react';
import { 
  Ministry, MinistryMemberRow, ScheduleRow, ScaleMemberRow,
  MinistryFormData, MinistryStatus
} from './types';
import { formatDatePtBr, StatusBadge } from './utils';

// ============= LIST VIEW =============
interface ListViewProps {
  filteredMinistries: Ministry[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: MinistryStatus | 'all';
  setStatusFilter: (value: MinistryStatus | 'all') => void;
  handleNewMinistry: () => void;
  handleEditMinistry: (ministry: Ministry) => void;
  handleDeleteMinistry: (id: string) => void;
  loadMinistryDetails: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  filteredMinistries,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  handleNewMinistry,
  handleEditMinistry,
  handleDeleteMinistry,
  loadMinistryDetails
}) => {
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar ministério..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMinistries.map((ministry) => (
            <div
              key={ministry.id}
              className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 cursor-pointer"
              onClick={() => loadMinistryDetails(ministry.id)}
            >
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
                  >
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteMinistry(ministry.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {ministry.descricao && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {ministry.descricao}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {ministry.membros_count ?? '-'}
                  </div>
                  <div className="text-xs text-slate-600">Membros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">
                    {ministry.escalas_count ?? '-'}
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
              {searchTerm ? 'Tente ajustar os filtros' : 'Comece criando seu primeiro ministério'}
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
};

// ============= FORM VIEW =============
interface FormViewProps {
  selectedMinistry: Ministry | null;
  formData: MinistryFormData;
  setFormData: React.Dispatch<React.SetStateAction<MinistryFormData>>;
  handleSave: () => void;
  handleCancel: () => void;
}

export const FormView: React.FC<FormViewProps> = ({
  selectedMinistry,
  formData,
  setFormData,
  handleSave,
  handleCancel
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition">
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva o propósito..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    status: e.target.value as MinistryStatus 
                  })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
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
};

// ============= DETAILS VIEW =============
interface DetailsViewProps {
  ministry: Ministry;
  activeTab: 'dados' | 'membros' | 'escalas';
  setActiveTab: (tab: 'dados' | 'membros' | 'escalas') => void;
  membersRows: MinistryMemberRow[];
  schedulesRows: ScheduleRow[];
  scaleMembersRows: Record<string, ScaleMemberRow[]>;
  handleBack: () => void;
  handleEdit: () => void;
  openAddMemberModal: () => void;
  openEditMemberModal: (member: MinistryMemberRow) => void;
  handleDeleteMember: (id: string) => void;
  openNewScheduleModal: () => void;
  openEditScheduleModal: (schedule: ScheduleRow) => void;
  handleDeleteSchedule: (id: string) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  ministry,
  activeTab,
  setActiveTab,
  membersRows,
  schedulesRows,
  scaleMembersRows,
  handleBack,
  handleEdit,
  openAddMemberModal,
  openEditMemberModal,
  handleDeleteMember,
  openNewScheduleModal,
  openEditScheduleModal,
  handleDeleteSchedule
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-white rounded-lg transition">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: ministry.cor + '20' }}
              >
                <Users className="w-6 h-6" style={{ color: ministry.cor }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{ministry.nome}</h2>
                <StatusBadge status={ministry.status} />
              </div>
            </div>
          </div>
          <button
            onClick={handleEdit}
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
                        : 'border-transparent text-slate-600 hover:text-slate-900'
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
                  <p className="text-slate-900">{ministry.descricao || 'Sem descrição'}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Cor</h3>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-slate-300"
                        style={{ backgroundColor: ministry.cor }}
                      />
                      <span className="text-slate-900 font-mono">{ministry.cor}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Status</h3>
                    <StatusBadge status={ministry.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-900 mb-1">
                      {membersRows.filter(m => m.status === 'ativo').length}
                    </div>
                    <div className="text-sm text-blue-700">Membros Ativos</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-900 mb-1">
                      {schedulesRows.length}
                    </div>
                    <div className="text-sm text-green-700">Escalas</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Membros */}
            {activeTab === 'membros' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Membros ({membersRows.length})
                  </h3>
                  <button
                    onClick={openAddMemberModal}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {membersRows.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {member.pessoa?.nome_completo || member.pessoa_id}
                          </div>
                          <div className="text-sm text-slate-600">
                            {member.pessoa?.email || member.pessoa?.telefone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={member.funcao || 'membro'} />
                        <StatusBadge status={member.status || 'ativo'} />
                        <button
                          onClick={() => openEditMemberModal(member)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {membersRows.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                    <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">Nenhum membro</p>
                    <button
                      onClick={openAddMemberModal}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar Primeiro
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Escalas */}
            {activeTab === 'escalas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Escalas ({schedulesRows.length})
                  </h3>
                  <button
                    onClick={openNewScheduleModal}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Escala
                  </button>
                </div>

                <div className="space-y-3">
                  {schedulesRows.map((schedule) => (
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
                              {formatDatePtBr(schedule.data_escala)}
                            </div>
                            <div className="text-sm text-slate-600">
                              {schedule.hora_inicio} - {schedule.hora_fim}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={schedule.status} />
                          <button
                            onClick={() => openEditScheduleModal(schedule)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {(scaleMembersRows[schedule.id] || []).length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                          <div className="text-xs font-medium text-slate-600 mb-2">
                            Membros ({(scaleMembersRows[schedule.id] || []).length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(scaleMembersRows[schedule.id] || []).map((sm) => (
                              <div
                                key={sm.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {sm.pessoa?.nome_completo || sm.pessoa_id}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {schedulesRows.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">Nenhuma escala</p>
                    <button
                      onClick={openNewScheduleModal}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Primeira
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};